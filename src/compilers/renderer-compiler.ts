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
    private elementCompiler: ElementCompiler

    constructor (
        componentInfo: ComponentInfo,
        componentTree: ComponentTree,
        noTemplateOutput: boolean,
        nsPrefix: string
    ) {
        this.noTemplateOutput = noTemplateOutput
        this.stringifier = new Stringifier(nsPrefix)
        this.elementCompiler = new ElementCompiler(componentInfo, componentTree, this.stringifier)
    }

    /**
    * 生成组件渲染的函数体
    */
    compile (info: ComponentInfo, emitter: PHPEmitter) {
        const component = info.component

        // 兼容 san-ssr-target-php@<=1.4.3
        emitter.writeIf('is_object($data)', () => {
            emitter.writeLine('$data = (array)$data;')
        })
        emitter.writeLine('$html = "";')

        this.genComponentContextCode(info, component, emitter)

        // call initData()
        const defaultData = (component.initData && component.initData()) || {}
        for (const key of Object.keys(defaultData)) {
            const val = this.stringifier.any(defaultData[key])
            emitter.writeLine(`$ctx->data["${key}"] = isset($ctx->data["${key}"]) ? $ctx->data["${key}"] : ${val};`)
        }

        // call inited()
        if (info.componentClass.prototype['inited']) {
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

        this.elementCompiler.tagStart(emitter, component.aNode, 'tagName', this.noTemplateOutput)
        emitter.writeIf('!$noDataOutput', () => emitter.writeDataComment())
        this.elementCompiler.inner(emitter, component.aNode)
        this.elementCompiler.tagEnd(emitter, component.aNode, 'tagName', this.noTemplateOutput)

        if (ifDirective) {
            emitter.unindent()
            emitter.writeLine('}')
        }

        emitter.writeLine('return $html;')
    }

    /**
    * 生成组件 renderer 时 ctx 对象构建的代码
    */
    genComponentContextCode (info: ComponentInfo, component: CompiledComponent<{}>, emitter: PHPEmitter) {
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
