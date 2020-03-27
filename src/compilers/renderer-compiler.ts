/**
 * 将组件树编译成 render 函数之间的递归调用
 * 提供 generateRenderModule 方法
 */
import { ComponentInfo, ComponentTree, CompiledComponent } from 'san-ssr'
import { PHPEmitter } from '../emitters/emitter'
import { expr } from '../compilers/expr-compiler'
import { Stringifier } from './stringifier'
import { ElementCompiler } from './element-compiler'

export class RendererCompiler {
    private namespacePrefix = ''
    private stringifier: Stringifier
    private noTemplateOutput: boolean

    constructor (
        private componentTree: ComponentTree,
        private emitter: PHPEmitter,
        noTemplateOutput: boolean
    ) {
        this.noTemplateOutput = noTemplateOutput
        this.stringifier = new Stringifier(emitter.nsPrefix)
    }

    /**
    * 生成组件渲染的函数体
    */
    compile (componentInfo: ComponentInfo) {
        const component = componentInfo.component
        const { emitter } = this

        // 兼容 san-ssr-target-php@<=1.4.3
        emitter.writeIf('is_object($data)', () => {
            emitter.writeLine('$data = (array)$data;')
        })
        emitter.writeLine('$html = "";')

        this.genComponentContextCode(componentInfo, component)

        // call initData()
        const defaultData = (component.initData && component.initData()) || {}
        for (const key of Object.keys(defaultData)) {
            const val = this.stringifier.any(defaultData[key])
            emitter.writeLine(`$ctx->data["${key}"] = isset($ctx->data["${key}"]) ? $ctx->data["${key}"] : ${val};`)
        }

        // call inited()
        if (componentInfo.componentClass.prototype['inited']) {
            emitter.writeLine('$ctx->instance->inited();')
        }

        // populate computed data
        emitter.writeForeach('$ctx->computedNames as $computedName', () => {
            emitter.writeLine('$data["$computedName"] = _::callComputed($ctx, $computedName);')
        })

        const ifDirective = component.aNode.directives['if']
        if (ifDirective) {
            emitter.writeLine('if (' + expr(ifDirective.value) + ') {')
            emitter.indent()
        }

        // 以这个 componentInfo 为入口元素，编译它以及它的所有子元素
        const elementCompiler = new ElementCompiler(componentInfo, this.componentTree, emitter, this.stringifier, this.noTemplateOutput)
        elementCompiler.tagStart(componentInfo.component.aNode, 'tagName')
        emitter.writeIf('!$noDataOutput', () => emitter.writeDataComment())
        elementCompiler.inner(componentInfo.component.aNode)
        elementCompiler.tagEnd(componentInfo.component.aNode, 'tagName')

        if (ifDirective) {
            emitter.unindent()
            emitter.writeLine('}')
        }

        emitter.writeLine('return $html;')
    }

    /**
    * 生成组件 renderer 时 ctx 对象构建的代码
    */
    genComponentContextCode (info: ComponentInfo, component: CompiledComponent<{}>) {
        const { emitter } = this
        emitter.nextLine('$ctx = (object)[];')
        const computedNames = Object.keys(component['computed']).map(x => `"${x}"`)
        emitter.writeLine(`$ctx->computedNames = [${computedNames.join(', ')}];`)
        emitter.writeLine(`$ctx->sanssrCid = ${info.cid || 0};`)
        emitter.writeLine('$ctx->sourceSlots = $sourceSlots;')
        emitter.writeLine('$ctx->owner = $parentCtx;')
        emitter.writeLine('$ctx->slotRenderers = [];')
        emitter.writeLine('$ctx->data = &$data;')
        emitter.writeLine('$ctx->instance = _::createComponent($ctx);')
    }
}
