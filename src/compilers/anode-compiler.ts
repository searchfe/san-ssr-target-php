import { ANode, ASlotNode, ATextNode, AForNode, ComponentConstructor, AIfNode, AFragmentNode } from 'san'
import { SanSourceFile, ComponentReference, TypeGuards, ComponentInfo, getANodePropByName } from 'san-ssr'
import { ElementCompiler } from './element-compiler'
import camelCase from 'camelcase'
import { PHPEmitter } from '../emitters/emitter'
import * as compileExprSource from '../compilers/expr-compiler'
import { NormalizedCompileOptions } from '../compile-options'
import { dirname, resolve } from 'path'
import { getNamespace } from '../utils/lang'

type ComponentInfoGetter = (CompilerClass: ComponentConstructor<{}, {}>) => ComponentInfo

/**
 * ANode 语义的表达
*/
export class ANodeCompiler {
    // 唯一 ID，用来产生临时变量名、函数名
    private id = 0
    // 用来编译普通 DOM 节点类型的 ANode
    private elementCompiler: ElementCompiler

    /**
     * @param info 所述的组件
     * @param ssrOnly 是否只在服务端渲染，可以减少输出大小，但不支持反解
     * @param emitter 输出器
     */
    constructor (
        private sourceFile: SanSourceFile,
        private info: ComponentInfo,
        private options: NormalizedCompileOptions,
        private emitter: PHPEmitter
    ) {
        this.elementCompiler = new ElementCompiler(this, emitter)
    }

    /**
     * @param aNode 要被编译的 aNode 节点
     * @param isRootElement 当前 aNode 是否是根元素，此时需要输出数据。
     *  1. compile 入口 aNode 时设为 true
     *  2. 根节点是组件时继续待到子组件的根 aNode
     */
    compile (aNode: ANode, isRootElement: boolean) {
        if (TypeGuards.isATextNode(aNode)) return this.compileText(aNode)
        if (TypeGuards.isAIfNode(aNode)) return this.compileIf(aNode)
        if (TypeGuards.isAForNode(aNode)) return this.compileFor(aNode)
        if (TypeGuards.isASlotNode(aNode)) return this.compileSlot(aNode)
        if (TypeGuards.isATemplateNode(aNode)) return this.compileTemplate(aNode)
        if (TypeGuards.isAFragmentNode(aNode)) return this.compileFragment(aNode)

        const ref = this.info.getChildComponentRenference(aNode)
        if (ref) {
            return this.compileComponent(aNode, ref, isRootElement)
        }

        this.compileElement(aNode, isRootElement)
    }

    compileText (aNode: ATextNode) {
        const { emitter } = this
        const shouldEmitComment = TypeGuards.isExprTextNode(aNode.textExpr) && aNode.textExpr.original && !this.options.ssrOnly
        if (shouldEmitComment) emitter.writeHTMLLiteral('<!--s-text-->')
        emitter.writeHTMLExpression(compileExprSource.expr(aNode.textExpr))
        if (shouldEmitComment) emitter.writeHTMLLiteral('<!--/s-text-->')
    }

    compileTemplate (aNode: ANode) {
        this.elementCompiler.inner(aNode)
    }

    compileFragment (aNode: AFragmentNode) {
        if (TypeGuards.isATextNode(aNode.children[0]) && !this.options.ssrOnly) {
            this.emitter.writeHTMLLiteral('<!--s-frag-->')
        }
        this.elementCompiler.inner(aNode)
        if (TypeGuards.isATextNode(aNode.children[aNode.children.length - 1]) && !this.options.ssrOnly) {
            this.emitter.writeHTMLLiteral('<!--/s-frag-->')
        }
    }

    compileIf (aNode: AIfNode) {
        const { emitter } = this
        const ifDirective = aNode.directives['if']
        const aNodeWithoutIf = Object.assign({}, aNode)
        delete aNodeWithoutIf.directives['if']

        emitter.writeIf(
            compileExprSource.expr(ifDirective.value),
            () => this.compile(aNodeWithoutIf, false)
        )

        for (const elseANode of aNode.elses || []) {
            const elifDirective = elseANode.directives.elif
            if (elifDirective) {
                emitter.beginElseIf(compileExprSource.expr(elifDirective.value))
            } else {
                emitter.beginElse()
            }

            this.compile(elseANode, false)
            emitter.endBlock()
        }
    }

    compileFor (aNode: AForNode) {
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
        const { emitter } = this

        emitter.writeLine(`$${listName} = ${compileExprSource.expr(forDirective.value)};`)
        emitter.writeIf(`is_array($${listName}) || is_object($${listName})`, () => {
            emitter.writeForeach(`$${listName} as $${indexName} => $value`, () => {
                emitter.writeLine(`$ctx->data['${indexName}'] = $${indexName};`)
                emitter.writeLine(`$ctx->data['${itemName}'] = $value;`)
                this.compile(forElementANode, false)
            })
        })
    }

    // 编译 slot 节点
    compileSlot (aNode: ASlotNode) {
        const rendererId = this.nextID()
        const { emitter } = this

        emitter.writeIf(`!isset($ctx->slotRenderers['${rendererId}'])`, () => {
            emitter.carriageReturn()
            emitter.write(`$ctx->slotRenderers['${rendererId}'] = `)
            emitter.writeAnonymousFunction([], ['&$ctx', '&$html'], () => {
                emitter.carriageReturn()
                emitter.write('$defaultSlotRender = ')
                emitter.writeAnonymousFunction(['$ctx'], [], () => {
                    emitter.writeLine(`$html = '';`)
                    for (const aNodeChild of aNode.children) this.compile(aNodeChild, false)
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
                    emitter.writeLine(`$slotCtx = (object)['sanssrCid' => $slotCtx->sanssrCid, 'class' => $slotCtx->class, 'data' => $slotCtx->data, 'instance' => $slotCtx->instance, 'owner' => $slotCtx->owner];`)
                }
                if (aNode.directives.bind) {
                    emitter.writeLine('_::extend($slotCtx->data, ' + compileExprSource.expr(aNode.directives.bind.value) + ');'); // eslint-disable-line
                }

                for (const varItem of aNode.vars || []) {
                    emitter.writeLine(
                        `$slotCtx->data['${varItem.name}'] = ` +
                        compileExprSource.expr(varItem.expr) + ';'
                    )
                }

                emitter.writeForeach('$mySourceSlots as $renderIndex => $slot', () => {
                    emitter.writeHTMLExpression('$slot($slotCtx);')
                })
            })
            emitter.write(';')
            emitter.writeNewLine()
        })
        emitter.writeLine(`call_user_func($ctx->slotRenderers['${rendererId}']);`)
    }

    private compileElement (aNode: ANode, isRootElement: boolean) {
        this.elementCompiler.tagStart(aNode)
        if (isRootElement && !this.options.ssrOnly) this.outputData()
        this.elementCompiler.inner(aNode)
        this.elementCompiler.tagEnd(aNode)
    }

    /**
     * @param aNode 要被编译的 aNode
     * @param ref 这个 aNode 引用的组件（一般是外部组件，不同于 aNode 所属组件）
     * @param isRootElement 是否需要输出数据，如果该组件是根组件，它为 true
     */
    compileComponent (aNode: ANode, ref: ComponentReference, isRootElement: boolean) {
        const { emitter } = this
        let dataLiteral = '[]'

        emitter.writeLine('$sourceSlots = [];')
        const defaultSourceSlots: ANode[] = []
        const sourceSlotCodes = {}

        for (const child of aNode.children!) {
            const slotBind = !child.textExpr && getANodePropByName(child, 'slot')
            if (slotBind) {
                const slotName = slotBind.expr.value
                sourceSlotCodes[slotName] = sourceSlotCodes[slotName] || {
                    children: [],
                    prop: slotBind
                }
                sourceSlotCodes[slotName].children.push(child)
            } else {
                defaultSourceSlots.push(child)
            }
        }

        if (defaultSourceSlots.length) {
            emitter.nextLine('array_push($sourceSlots, [')
            emitter.writeAnonymousFunction(['$ctx'], [], () => {
                emitter.writeLine(`$html = '';`)
                defaultSourceSlots.forEach((child: ANode) => this.compile(child, false))
                emitter.writeLine('return $html;')
            })
            emitter.feedLine(']);')
        }

        for (const key in sourceSlotCodes) {
            const sourceSlotCode = sourceSlotCodes[key]
            emitter.nextLine('array_push($sourceSlots, [')
            emitter.writeAnonymousFunction(['$ctx'], [], () => {
                emitter.writeLine(`$html = '';`)
                sourceSlotCode.children.forEach((child: ANode) => this.compile(child, false))
                emitter.writeLine('return $html;')
            })
            emitter.feedLine(', ' + compileExprSource.expr(sourceSlotCode.prop.expr) + ']);')
        }

        const givenData = []
        for (const prop of aNode.props) {
            const key = emitter.stringify(camelCase(prop.name))
            const val = compileExprSource.expr(prop.expr)
            givenData.push(`${key} => ${val}`)
        }

        dataLiteral = '[' + givenData.join(', ') + ']'
        if (aNode.directives.bind) {
            const bindData = compileExprSource.expr(aNode.directives.bind.value)
            dataLiteral = `_::combine(${bindData}, ${dataLiteral})`
        }

        const name = ref.isDefault ? 'render' : 'render' + ref.id
        const renderId = ref.relativeFilePath === '.'
            ? name
            : '\\' + this.getNamespace(ref) + '\\' + name
        const ndo = isRootElement ? '$noDataOutput' : 'true'
        emitter.nextLine(`$html .= `)
        emitter.writeFunctionCall(renderId, [dataLiteral, ndo, '$ctx', emitter.stringify(aNode.tagName), '$sourceSlots'])
        emitter.feedLine(';')
        emitter.writeLine('$sourceSlots = null;')
    }

    private outputData () {
        this.emitter.writeIf('!$noDataOutput', () => this.emitter.writeDataComment())
    }

    private nextID () {
        return 'sanssrId' + (this.id++)
    }

    /**
     * 根据组件引用（通常是外部组件）得到被引用组件的命名空间
     */
    private getNamespace (ref: ComponentReference): string {
        const filePath = resolve(dirname(this.sourceFile.getFilePath()), ref.relativeFilePath)
        return getNamespace(this.options.nsPrefix, this.options.nsRootDir, filePath)
    }
}
