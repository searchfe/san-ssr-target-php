import { ANode, ASlotNode, ATextNode, AForNode, ComponentConstructor, AIfNode, ExprStringNode } from 'san'
import { CompiledComponent, isComponentLoader, TypeGuards, ComponentInfo, getANodePropByName, getANodeProps } from 'san-ssr'
import { ElementCompiler } from './element-compiler'
import { Stringifier } from './stringifier'
import { PHPEmitter } from '../emitters/emitter'
import * as compileExprSource from '../compilers/expr-compiler'

type ComponentInfoGetter = (CompilerClass: ComponentConstructor<{}, {}>) => ComponentInfo

/**
* ANode 的编译方法集合对象
*/
export class ANodeCompiler {
    private id = 0
    private elementCompiler: ElementCompiler
    private stringifier: Stringifier
    private component: CompiledComponent<{}>
    private getComponentInfoByClass: ComponentInfoGetter

    // TODO replace CompiledComponent with componentInfo
    constructor (component: CompiledComponent<{}>, elementCompiler: ElementCompiler, stringifier: Stringifier, getComponentInfoByClass: ComponentInfoGetter) {
        this.component = component
        this.elementCompiler = elementCompiler
        this.stringifier = stringifier
        this.getComponentInfoByClass = getComponentInfoByClass
    }

    compile (aNode: ANode, emitter: PHPEmitter) {
        if (TypeGuards.isATextNode(aNode)) return this.compileText(aNode, emitter)
        if (TypeGuards.isAIfNode(aNode)) return this.compileIf(aNode, emitter)
        if (TypeGuards.isAForNode(aNode)) return this.compileFor(aNode, emitter)
        if (TypeGuards.isASlotNode(aNode)) return this.compileSlot(aNode, emitter)
        if (TypeGuards.isATemplateNode(aNode)) return this.compileTemplate(aNode, emitter)

        let ComponentClass = this.component.getComponentType
            ? this.component.getComponentType(aNode)
            : this.component.components[aNode.tagName]
        if (ComponentClass) {
            if (isComponentLoader(ComponentClass)) {
                ComponentClass = ComponentClass.placeholder
                if (!ComponentClass) return
            }
            return this.compileComponent(aNode, emitter, this.getComponentInfoByClass(ComponentClass))
        }
        this.compileElement(aNode, emitter)
    }

    compileText (aNode: ATextNode, emitter: PHPEmitter) {
        if (aNode.textExpr.original) {
            emitter.writeIf('!$noDataOutput', () => {
                emitter.bufferHTMLLiteral('<!--s-text-->')
                emitter.clearStringLiteralBuffer()
            })
        }

        if (aNode.textExpr.value != null) {
            emitter.bufferHTMLLiteral((aNode.textExpr.segs[0] as ExprStringNode).literal!)
        } else {
            emitter.writeHTML(compileExprSource.expr(aNode.textExpr))
        }

        if (aNode.textExpr.original) {
            emitter.writeIf('!$noDataOutput', () => {
                emitter.bufferHTMLLiteral('<!--/s-text-->')
                emitter.clearStringLiteralBuffer()
            })
        }
    }

    compileTemplate (aNode: ANode, emitter: PHPEmitter) {
        this.elementCompiler.inner(emitter, aNode)
    }

    compileIf (aNode: AIfNode, emitter: PHPEmitter) {
        // output if
        const ifDirective = aNode.directives['if'] // eslint-disable-line dot-notation
        emitter.writeIf(compileExprSource.expr(ifDirective.value), () => {
            this.compile(aNode.ifRinsed, emitter)
        })

        // output elif and else
        for (const elseANode of aNode.elses || []) {
            const elifDirective = elseANode.directives.elif
            if (elifDirective) {
                emitter.beginElseIf(compileExprSource.expr(elifDirective.value))
            } else {
                emitter.beginElse()
            }

            this.compile(elseANode, emitter)
            emitter.endBlock()
        }
    }

    compileFor (aNode: AForNode, emitter: PHPEmitter) {
        const forElementANode: ANode = {
            children: aNode.children,
            props: aNode.props,
            events: aNode.events,
            tagName: aNode.tagName,
            directives: { ...aNode.directives }
        }
        delete forElementANode.directives.for

        const forDirective = aNode.directives.for
        const itemName = forDirective.item
        const indexName = forDirective.index || this.nextID()
        const listName = this.nextID()

        emitter.writeLine(`$${listName} = ${compileExprSource.expr(forDirective.value)};`)
        emitter.writeIf(`is_array($${listName}) || is_object($${listName})`, () => {
            emitter.writeForeach(`$${listName} as $${indexName} => $value`, () => {
                emitter.writeLine(`$ctx->data["${indexName}"] = $${indexName};`)
                emitter.writeLine(`$ctx->data["${itemName}"] = $value;`)
                this.compile(forElementANode, emitter)
            })
        })
    }

    // 编译 slot 节点
    compileSlot (aNode: ASlotNode, emitter: PHPEmitter) {
        const rendererId = this.nextID()

        emitter.writeIf(`!isset($ctx->slotRenderers["${rendererId}"])`, () => {
            emitter.carriageReturn()
            emitter.write(`$ctx->slotRenderers["${rendererId}"] = `)
            emitter.writeAnonymousFunction([], ['&$ctx', '&$html'], () => {
                emitter.carriageReturn()
                emitter.write('$defaultSlotRender = ')
                emitter.writeAnonymousFunction(['$ctx'], [], () => {
                    emitter.writeLine('$html = "";')
                    for (const aNodeChild of aNode.children || []) this.compile(aNodeChild, emitter)
                    emitter.writeLine('return $html;')
                })
                emitter.write(';')

                emitter.writeLine('$isInserted = false;')
                emitter.writeLine('$ctxSourceSlots = $ctx->sourceSlots;')
                emitter.writeLine('$mySourceSlots = [];')

                const nameProp = getANodePropByName(aNode, 'name')
                if (nameProp) {
                    emitter.writeLine('$slotName = ' + compileExprSource.expr(nameProp.expr) + ';')

                    emitter.writeForeach('$ctxSourceSlots as $i => $slot', () => {
                        emitter.writeIf('count($slot) > 1 && $slot[1] == $slotName', () => {
                            emitter.writeLine('array_push($mySourceSlots, $slot[0]);')
                            emitter.writeLine('$isInserted = true;')
                        })
                    })
                } else {
                    emitter.writeIf('count($ctxSourceSlots) > 0 && !isset($ctxSourceSlots[0][1])', () => {
                        emitter.writeLine('array_push($mySourceSlots, $ctxSourceSlots[0][0]);')
                        emitter.writeLine('$isInserted = true;')
                    })
                }

                emitter.writeIf('!$isInserted', () => {
                    emitter.writeLine('array_push($mySourceSlots, $defaultSlotRender);')
                })
                emitter.writeLine('$slotCtx = $isInserted ? $ctx->owner : $ctx;')

                if (aNode.vars || aNode.directives.bind) {
                    emitter.writeLine('$slotCtx = (object)["sanssrCid" => $slotCtx->sanssrCid, "data" => $slotCtx->data, "instance" => $slotCtx->instance, "owner" => $slotCtx->owner];')

                    if (aNode.directives.bind) {
                        emitter.writeLine('_::extend($slotCtx->data, ' + compileExprSource.expr(aNode.directives.bind.value) + ');'); // eslint-disable-line
                    }

                    for (const varItem of aNode.vars || []) {
                        emitter.writeLine(
                            `$slotCtx->data["${varItem.name}"] = ` +
                            compileExprSource.expr(varItem.expr) + ';'
                        )
                    }
                }

                emitter.writeForeach('$mySourceSlots as $renderIndex => $slot', () => {
                    emitter.writeHTML('$slot($slotCtx);')
                })
            })
            emitter.write(';')
            emitter.writeNewLine()
        })
        emitter.writeLine(`call_user_func($ctx->slotRenderers["${rendererId}"]);`)
    }

    compileElement (aNode: ANode, emitter: PHPEmitter) {
        this.elementCompiler.tagStart(emitter, aNode)
        this.elementCompiler.inner(emitter, aNode)
        this.elementCompiler.tagEnd(emitter, aNode)
    }

    compileComponent (aNode: ANode, emitter: PHPEmitter, info: ComponentInfo) {
        let dataLiteral = '[]'

        emitter.writeLine('$sourceSlots = [];')
        if (aNode.children) {
            const defaultSourceSlots: ANode[] = []
            const sourceSlotCodes = {}

            for (const child of aNode.children) {
                const slotBind = !child.textExpr && getANodePropByName(child, 'slot')
                if (slotBind) {
                    if (!sourceSlotCodes[slotBind.raw]) {
                        sourceSlotCodes[slotBind.raw] = {
                            children: [],
                            prop: slotBind
                        }
                    }

                    sourceSlotCodes[slotBind.raw].children.push(child)
                } else {
                    defaultSourceSlots.push(child)
                }
            }

            if (defaultSourceSlots.length) {
                emitter.nextLine('array_push($sourceSlots, [')
                emitter.writeAnonymousFunction(['$ctx'], [], () => {
                    emitter.writeLine('$html = "";')
                    defaultSourceSlots.forEach((child: ANode) => this.compile(child, emitter))
                    emitter.writeLine('return $html;')
                })
                emitter.feedLine(']);')
            }

            for (const key in sourceSlotCodes) {
                const sourceSlotCode = sourceSlotCodes[key]
                emitter.nextLine('array_push($sourceSlots, [')
                emitter.writeAnonymousFunction(['$ctx'], [], () => {
                    emitter.writeLine('$html = "";')
                    sourceSlotCode.children.forEach((child: ANode) => this.compile(child, emitter))
                    emitter.writeLine('return $html;')
                })
                emitter.feedLine(', ' + compileExprSource.expr(sourceSlotCode.prop.expr) + ']);')
            }
        }

        const givenData = []
        for (const prop of getANodeProps(aNode)) {
            const key = compileExprSource.stringLiteralize(prop.name)
            const val = compileExprSource.expr(prop.expr)
            givenData.push(`${key} => ${val}`)
        }

        dataLiteral = '[' + givenData.join(',\n') + ']'
        if (aNode.directives.bind) {
            const bindData = compileExprSource.expr(aNode.directives.bind.value)
            emitter.writeLine(`$childData = ${bindData};`)
            dataLiteral = `_::extend($childData, ${dataLiteral})`
        }

        const renderId = 'sanssrRenderer' + info.cid
        emitter.nextLine(`$html .= `)
        emitter.writeFunctionCall(renderId, [dataLiteral, 'true', '$ctx', this.stringifier.str(aNode.tagName), '$sourceSlots'])
        emitter.feedLine(';')
        emitter.writeLine('$sourceSlots = null;')
    }

    private nextID () {
        return 'sanssrId' + (this.id++)
    }
}
