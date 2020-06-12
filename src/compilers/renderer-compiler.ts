import { ComponentInfo, ComponentTree } from 'san-ssr'
import { PHPEmitter } from '../emitters/emitter'
import { ANodeCompiler } from './anode-compiler'

export class RendererCompiler {
    private namespacePrefix = ''

    /**
     * @param componentTree 组件树，用来从中注册、解析新的动态组件
     * @param ssrOnly 产出 HTML 是否只用于 SSR（无法浏览器端反解）
     * @param emitter 代码产出的收集器
     */
    constructor (
        private componentTree: ComponentTree,
        private ssrOnly: boolean,
        private emitter: PHPEmitter
    ) {}

    /**
    * 生成组件渲染的函数体。把组件编译为 `render(data): string` 函数。
    *
    * @param info 要被编译的组件信息
    */
    compile (info: ComponentInfo) {
        const { componentClass, rootANode, proto } = info
        const { emitter } = this

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

        const aNodeCompiler = new ANodeCompiler(info, this.componentTree, this.ssrOnly, emitter)
        aNodeCompiler.compile(rootANode, true)
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
