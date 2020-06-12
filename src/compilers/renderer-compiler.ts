/**
 * 将组件树编译成 render 函数之间的递归调用
 * 提供 generateRenderModule 方法
 */
import { ComponentInfo, ComponentTree, TypeGuards } from 'san-ssr'
import { PHPEmitter } from '../emitters/emitter'
import { expr } from '../compilers/expr-compiler'
import { ElementCompiler } from './element-compiler'

export class RendererCompiler {
    private namespacePrefix = ''
    private noTemplateOutput: boolean

    constructor (
        private componentTree: ComponentTree,
        private emitter: PHPEmitter,
        noTemplateOutput: boolean
    ) {
        this.noTemplateOutput = noTemplateOutput
    }

    /**
    * 生成组件渲染的函数体
    */
    compile (info: ComponentInfo) {
        const { componentClass, rootANode, proto } = info
        const { emitter } = this

        // 兼容 san-ssr-target-php@<=1.4.3
        emitter.writeIf('is_object($data)', () => {
            emitter.writeLine('$data = (array)$data;')
        })
        emitter.writeLine('$html = "";')

        this.genComponentContextCode(info)

        // call initData()
        const defaultData = (proto.initData && proto.initData()) || {}
        for (const key of Object.keys(defaultData)) {
            const val = emitter.stringify(defaultData[key])
            emitter.writeLine(`$ctx->data["${key}"] = isset($ctx->data["${key}"]) ? $ctx->data["${key}"] : ${val};`)
        }

        // call inited()
        if (componentClass.prototype['inited']) {
            emitter.writeLine('$ctx->instance->inited();')
        }

        // populate computed data
        emitter.writeForeach('$ctx->computedNames as $computedName', () => {
            emitter.writeLine('$data["$computedName"] = _::callComputed($ctx, $computedName);')
        })

        const elementCompiler = new ElementCompiler(info, this.componentTree, emitter, this.noTemplateOutput)

        if (TypeGuards.isATextNode(rootANode)) {
            elementCompiler.aNodeCompiler.compile(rootANode)
        } else {
            const ifDirective = rootANode.directives['if']
            if (ifDirective) {
                emitter.writeLine('if (' + expr(ifDirective.value) + ') {')
                emitter.indent()
            }

            elementCompiler.tagStart(rootANode, 'tagName')
            emitter.writeIf('!$noDataOutput', () => emitter.writeDataComment())
            elementCompiler.inner(rootANode)
            elementCompiler.tagEnd(rootANode, 'tagName')

            if (ifDirective) {
                emitter.unindent()
                emitter.writeLine('}')
            }
        }

        emitter.writeLine('return $html;')
    }

    /**
    * 生成组件 renderer 时 ctx 对象构建的代码
    */
    genComponentContextCode (info: ComponentInfo) {
        const { emitter } = this
        emitter.nextLine('$ctx = (object)[];')
        const computedNames = Object.keys(info.proto.computed).map(x => `"${x}"`)
        emitter.writeLine(`$ctx->computedNames = [${computedNames.join(', ')}];`)
        emitter.writeLine(`$ctx->sanssrCid = ${info.cid || 0};`)
        emitter.writeLine('$ctx->sourceSlots = $sourceSlots;')
        emitter.writeLine('$ctx->owner = $parentCtx;')
        emitter.writeLine('$ctx->slotRenderers = [];')
        emitter.writeLine('$ctx->data = &$data;')
        emitter.writeLine('$ctx->instance = _::createComponent($ctx);')
    }
}
