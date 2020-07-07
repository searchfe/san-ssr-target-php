import { isTypedSanSourceFile, SanProject, Compiler, SanSourceFile } from 'san-ssr'
import { PHPTranspiler } from './compilers/ts2php'
import { transformToFavorPHP } from './transformers/index'
import { CompilerOptions } from 'ts-morph'
import { RendererCompiler } from './compilers/renderer-compiler'
import { PHPEmitter } from './emitters/emitter'
import { sep, isAbsolute, resolve } from 'path'
import debugFactory from 'debug'
import { emitHelpers } from './emitters/helpers'
import { defaultHelpersNS, normalizeCompileOptions, CompileOptions, NormalizedCompileOptions } from './compile-options'
import { getNamespace } from './utils/lang'

const debug = debugFactory('san-ssr:target-php')

export default class ToPHPCompiler implements Compiler {
    private root: string
    private phpTranspiler: PHPTranspiler

    constructor (private project: SanProject) {
        const tsConfigFilePath = project.tsConfigFilePath
        if (!tsConfigFilePath) throw new Error('tsconfig.json path is required')
        this.root = tsConfigFilePath.split(sep).slice(0, -1).join(sep)

        const compilerOptions = require(tsConfigFilePath)['compilerOptions']
        const options = this.normalizeCompilerOptions(compilerOptions)
        this.phpTranspiler = new PHPTranspiler(options)
    }

    public compileToSource (sourceFile: SanSourceFile, options: CompileOptions) {
        const opts = normalizeCompileOptions(options)
        const emitter = new PHPEmitter(opts.emitHeader, opts.importHelpers)
        transformToFavorPHP(sourceFile)

        if (opts.importHelpers) {
            emitter.writeNamespace(getNamespace(opts.nsPrefix, opts.nsRootDir, sourceFile.getFilePath()))
            this.emitRenderer(sourceFile, opts, emitter)
            this.emitComponent(sourceFile, opts, emitter)
        } else {
            emitter.writeNamespace(getNamespace(opts.nsPrefix, opts.nsRootDir, sourceFile.getFilePath()), () => {
                this.emitRenderer(sourceFile, opts, emitter)
                this.emitComponent(sourceFile, opts, emitter)
            })
            emitter.writeNamespace(defaultHelpersNS, () => emitHelpers(emitter))
        }

        return emitter.fullText()
    }

    /**
     * 产出一份 runtime 代码
     * 配合 compileToSource importHelpers 参数来避免每份组件都包含一份 helpers
     *
     * @param emitHeader 是否输出 `<?php` 头
     * @param namespace 产出 helper 的命名空间，默认值是 "san\\runtime"
     */
    public static emitHelpers ({
        emitHeader = true,
        namespace = defaultHelpersNS
    } = {}) {
        const emitter = new PHPEmitter(emitHeader)
        namespace && emitter.writeNamespace(namespace)
        emitHelpers(emitter)
        return emitter.fullText()
    }

    public static fromSanProject (sanProject: SanProject) {
        return new ToPHPCompiler(sanProject)
    }

    /**
     * 为 sourceFile 包含的所有组件生成 renderer 函数，并为入口组件生成入口 render()。
     */
    private emitRenderer (sourceFile: SanSourceFile, options: NormalizedCompileOptions, emitter: PHPEmitter) {
        if (!sourceFile.componentInfos.length) return

        // 引入 renderer 的各种依赖
        const helpersNS = options.importHelpers || defaultHelpersNS
        emitter.writeLine(`use ${helpersNS}\\_;`)
        emitter.writeLine(`use ${helpersNS}\\SanSSRData;`)
        emitter.writeLine(`use ${helpersNS}\\SanSSRComponent;`)

        const rc = new RendererCompiler(
            sourceFile,
            options,
            emitter
        )
        for (const info of sourceFile.componentInfos) rc.compile(info)
    }

    /**
     * 产出组件代码，比如组件类的 PHP 代码，供 render 使用
     */
    private emitComponent (sourceFile: SanSourceFile, options: NormalizedCompileOptions, emitter: PHPEmitter) {
        if (!isTypedSanSourceFile(sourceFile)) return ''

        const helpersNS = options.importHelpers || defaultHelpersNS
        const modules = {
            'san-ssr-target-php': {
                name: 'san-ssr-target-php',
                namespace: helpersNS + '\\',
                used: true,
                required: true
            }
        }

        for (const decl of sourceFile.tsSourceFile.getImportDeclarations()) {
            const literal = decl.getModuleSpecifierValue()
            const filepath = decl.getModuleSpecifierSourceFileOrThrow().getFilePath()
            if (literal[0] !== '.') continue
            modules[literal] = {
                name: literal,
                required: false,
                namespace: '\\' + getNamespace(options.nsPrefix, options.nsRootDir, filepath) + '\\'
            }
        }
        emitter.writeLines(this.phpTranspiler.compile(
            sourceFile.tsSourceFile,
            { ...modules, ...options.modules },
            helpersNS
        ))
    }

    /**
     * 归一化 tsconfig 里的 compilerOptions
     * 比如，把相对路径的 baseUrl 改绝对，否则传递下去工作路径的信息就丢失了。
     */
    private normalizeCompilerOptions (compilerOptions: CompilerOptions) {
        let baseUrl = compilerOptions.baseUrl
        if (baseUrl && !isAbsolute(baseUrl) && this.root) {
            baseUrl = resolve(this.root, baseUrl)
            compilerOptions.baseUrl = baseUrl
        }
        return compilerOptions
    }
}
