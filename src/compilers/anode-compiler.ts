import { ExprNode, ANode, ASlotNode, ATextNode, AForNode, ComponentConstructor, AIfNode, AFragmentNode } from 'san'
import { SanSourceFile, ComponentReference, TypeGuards, ComponentInfo, getANodePropByName } from 'san-ssr'
import { ElementCompiler } from './element-compiler'
import camelCase from 'camelcase'
import { PHPEmitter } from '../emitters/emitter'
import { NormalizedCompileOptions } from '../compile-options'
import { dirname, resolve } from 'path'
import { getNamespace, normalizeNamespaceSlug } from '../utils/lang'

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
        public options: NormalizedCompileOptions,
        private emitter: PHPEmitter
    ) {
        this.elementCompiler = new ElementCompiler(this, this.options.exprCompiler, emitter)
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
        emitter.writeHTMLExpression(this.expr(aNode.textExpr, true))
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
            this.expr(ifDirective.value),
            () => this.compile(aNodeWithoutIf, false)
        )

        for (const elseANode of aNode.elses || []) {
            const elifDirective = elseANode.directives.elif
            if (elifDirective) {
                emitter.beginElseIf(this.expr(elifDirective.value))
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

        emitter.writeLine(`$${listName} = ${this.expr(forDirective.value)};`)
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
        const { emitter } = this
        const fnName = `$renderSlot${this.nextID()}`

        emitter.nextLine(`${fnName} = `)
        emitter.writeAnonymousFunction([], ['&$ctx', '&$html', '&$parentCtx'], () => {
            /*
             * 产生调用 slot 的数据
             */
            emitter.writeLine('$data = [];')
            // <div slot="foo" s-bind="{foo, bar}">
            if (aNode.directives.bind) {
                emitter.writeLine('_::extend($data, ' + this.expr(aNode.directives.bind.value) + ');')
            }
            // <div slot="foo" var-foo=foo var-bar=bar>
            for (const item of aNode.vars || []) {
                emitter.writeLine(`$data["${item.name}"] = ${this.expr(item.expr)};`)
            }

            /*
             * 获得 slot render 函数
             */
            emitter.nextLine('$defaultSlotRender = ')
            this.compileSlotRenderer(aNode.children)
            emitter.feedLine(';')

            const nameProp = getANodePropByName(aNode, 'name')
            const slotNameExpr = nameProp ? this.expr(nameProp.expr) : '""'
            emitter.writeLine(`$slotRenders = $ctx->slots[${slotNameExpr}];`)

            emitter.writeIf('!isset($slotRenders) || !count($slotRenders)', () => {
                emitter.writeLine('$slotRenders = [$defaultSlotRender];')
            })

            /*
             * 调用 slot render 函数
             */
            emitter.writeForeach('$slotRenders as $slotRender', () => {
                emitter.writeLine(`$html .= $slotRender($parentCtx, $data);`)
            })
        })
        emitter.feedLine(';')
        emitter.writeLine(`${fnName}();`)
    }

    private compileSlotRenderer (content: ANode[]) {
        const { emitter } = this

        /**
         * $parentCtx：调用该 slot render 的上下文。
         * 如：父组件定义的 slot render 会被子组件调用，此时 parentCtx 为子组件 ctx
         */
        emitter.writeAnonymousFunction(['$parentCtx', '$data'], ['$ctx'], () => {
            if (!content.length) {
                emitter.writeLine('return "";')
                return
            }
            emitter.writeLine('$html = "";')
            emitter.writeLine('_::extend($ctx->data, $data);')
            for (const child of content) this.compile(child, false)
            emitter.writeLine('return $html;')
        })
    }

    private compileElement (aNode: ANode, isRootElement: boolean) {
        this.elementCompiler.tagStart(aNode)
        if (isRootElement && !this.options.ssrOnly) this.outputData()
        this.elementCompiler.inner(aNode)
        this.elementCompiler.tagEnd(aNode)
    }

    /**
     * @param aNode 要被编译的 AComponentNode
     * @param ref 这个 aNode 引用的组件（一般是外部组件，不同于 aNode 所属组件）
     * @param isRootElement 是否需要输出数据，如果该组件是根组件，它为 true
     */
    compileComponent (aNode: ANode, ref: ComponentReference, isRootElement: boolean) {
        const { emitter } = this

        /**
         * 收集使用组件时，子元素里所有的 slots
         */
        emitter.writeLine('$slots = [];')
        for (const child of aNode.children!) {
            const slotBind = !child.textExpr && getANodePropByName(child, 'slot')
            const name = slotBind ? '$slotName' + this.nextID() : '""'
            if (slotBind) emitter.writeLine(`${name} = ${this.expr(slotBind.expr)};`)

            emitter.writeLine(`if (!array_key_exists(${name}, $slots)) $slots[${name}] = [];`)
            emitter.nextLine(`array_push($slots[${name}], `)
            this.compileSlotRenderer([child])
            emitter.feedLine(');')
        }

        /**
         * 生成使用子组件时，传入的数据
         */
        const givenData = []
        for (const prop of aNode.props) {
            const key = emitter.stringify(camelCase(prop.name))
            const val = this.expr(prop.expr, false)
            givenData.push(`${key} => ${val}`)
        }

        let dataLiteral = '[' + givenData.join(', ') + ']'
        if (aNode.directives.bind) {
            const bindData = this.expr(aNode.directives.bind.value)
            dataLiteral = `_::combine(${bindData}, ${dataLiteral})`
        }

        /**
         * 调用子组件 render，并传给它父组件定义的 $slots 和 $data
         */
        const name = ref.isDefault ? 'render' : 'render' + ref.id
        const renderId = ref.specifier === '.'
            ? name
            : '\\' + this.getNamespace(ref) + '\\' + name
        const ndo = isRootElement ? '$noDataOutput' : 'true'
        emitter.nextLine(`$html .= `)
        emitter.writeFunctionCall(renderId, [dataLiteral, ndo, '$parentCtx', emitter.stringify(aNode.tagName), '$slots'])
        emitter.feedLine(';')
    }

    private expr (e: ExprNode, escapeHTML?: boolean) {
        return this.options.exprCompiler.compile(e, escapeHTML)
    }

    private outputData () {
        this.emitter.writeIf('!$noDataOutput', () => {
            const code = `'<!--s-data:' . _::json_encode(_::getRootContext($ctx)->data) . '-->'`
            this.emitter.writeHTMLExpression(code)
        })
    }

    private nextID () {
        return 'sanssrId' + (this.id++)
    }

    /**
     * 根据组件引用（通常是外部组件）得到被引用组件的命名空间
     */
    private getNamespace (ref: ComponentReference): string {
        let ns = ''
        const ret = this.options.getModuleNamespace(ref.specifier)
        ns = ret.replace(/^\\/, '').replace(/\\$/, '').split('\\').map(normalizeNamespaceSlug).join('\\')
        if (!ns) {
            const filePath = resolve(dirname(this.sourceFile.getFilePath()), ref.specifier)
            ns = getNamespace(this.options.nsPrefix, this.options.nsRootDir, filePath)
        }
        return ns
    }
}
