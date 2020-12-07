import { SanSourceFile, DynamicComponentInfo, TypedComponentInfo, ComponentInfo } from 'san-ssr'
import assert from 'assert'
import { NormalizedCompileOptions } from '../compile-options'
import { PHPEmitter } from '../emitters/emitter'
import { ANodeCompiler } from './anode-compiler'
import { getNamespace } from '../utils/lang'
import { ReferenceCompiler } from './reference-compiler'

export class RendererCompiler {
    private referenceCompiler: ReferenceCompiler

    constructor (
        /**
         * 当前编译的源文件
         */
        private sourceFile: SanSourceFile,
        private options: NormalizedCompileOptions,
        /**
         * 代码产出的收集器
         */
        private emitter: PHPEmitter = new PHPEmitter()
    ) {
        this.referenceCompiler = new ReferenceCompiler(this.sourceFile.getFilePath(), options)
    }

    /**
    * 生成组件渲染的函数。
    *
    * @param info 要被编译的组件信息
    */
    compile (info: ComponentInfo) {
        const rendererName = this.sourceFile.entryComponentInfo === info
            ? this.options.renderFunctionName
            : `render${info.id}`
        const argumentList = ['$data', '$noDataOutput = false', '$parentCtx = []', '$tagName = \'div\'', '$slots = []']
        this.emitter.carriageReturn()
        this.emitter.writeFunction(rendererName, argumentList, [], () => this.emitRendererBody(info))
    }

    /**
     * 生成 renderer 函数体
     */
    emitRendererBody (info: ComponentInfo) {
        const { emitter } = this
        /**
         * 没有 ANode 的组件直接返回空，比如 load-success 样例。
         *
         * Note: 这类组件仍然需要产生 render() 函数，是因为它可能会被
         * 其他文件的组件引用，而其他文件里的组件并不知道该组件是否是空组件。
         */
        if (!info.root) {
            emitter.writeLine('return \'\';')
            return emitter.fullText()
        }

        this.emitComponentContext(info)
        if (info.hasMethod('initData')) this.emitInitData(info)
        if (info.hasMethod('inited')) this.emitInited()
        emitter.writeLine('$ctx->instance->data->populateComputed();')
        emitter.nextLine('$parentCtx = $ctx;')

        const aNodeCompiler = new ANodeCompiler(
            this.sourceFile,
            info,
            this.options,
            emitter
        )
        emitter.writeLine('$html = \'\';')
        aNodeCompiler.compile(info.root, true)
        emitter.writeLine('return $html;')
    }

    /**
     * 调用组件的 inited() 生命周期
     */
    emitInited () {
        this.emitter.writeLine('$ctx->instance->inited();')
    }

    /**
     * 产生组件 initData() 的代码
     */
    emitInitData (info: ComponentInfo) {
        assert(!(info instanceof DynamicComponentInfo))
        this.emitInitDataInRuntime()
    }

    /**
     * 静态分析的组件，必须在运行时去执行 initData() 并合并数据
     */
    emitInitDataInRuntime () {
        const { emitter } = this
        emitter.writeLine('$sanSSRInitData = $ctx->instance->initData();')
        emitter.writeIf('$sanSSRInitData', () => {
            emitter.writeForeach('$sanSSRInitData as $key => $val', () => {
                emitter.writeLine('$ctx->data[$key] = isset($ctx->data[$key]) ? $ctx->data[$key] : $val;')
            })
        })
    }

    getFullText () {
        return this.emitter.fullText()
    }

    /**
    * 生成组件 renderer 时 ctx 对象构建的代码
    */
    private emitComponentContext (info: ComponentInfo) {
        const { emitter } = this
        emitter.nextLine('$ctx = (object)[];')
        emitter.writeLine('$ctx->parentCtx = $parentCtx;')
        emitter.writeLine('$ctx->data = &$data;')

        if (isTypedComponentInfo(info)) {
            const className = info.classDeclaration.getName()
            emitter.writeLine(`$ctx->instance = new ${className}();`)
            emitter.writeLine('$ctx->instance->parentComponent = $parentCtx->instance;')
        } else {
            emitter.writeLine('$ctx->instance = new SanSSRComponent();')
        }
        const computedList = info.getComputedNames().map(x => `'${x}'`)
        emitter.writeLine(`$ctx->instance->data = new SanSSRData($ctx, [${computedList.join(', ')}]);`)
        emitter.writeLine('$ctx->slots = $slots;')

        const refs = [...info.childComponents.entries()].map(([key, val]) => {
            const fnFullName = this.referenceCompiler.compileToFunctionFullName(val)
            return `"${key}" => '${fnFullName}'`
        }).join(', ')
        emitter.writeLine(`$ctx->refs = [${refs}];`)
    }
}

function isTypedComponentInfo (info: any): info is TypedComponentInfo {
    return typeof info.classDeclaration !== 'undefined'
}
