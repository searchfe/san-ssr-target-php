import { SanProject, Compiler, SanSourceFile, SanApp, getInlineDeclarations } from 'san-ssr'
import { isReserved } from './utils/lang'
import { Modules, PHPCodeGenerator } from './compilers/ts2php'
import { transformAstToPHP } from './transformers/index'
import { Project } from 'ts-morph'
import { RendererCompiler } from './compilers/renderer-compiler'
import { PHPEmitter } from './emitters/emitter'
import camelCase from 'camelcase'
import { sep, extname, isAbsolute, resolve } from 'path'
import debugFactory from 'debug'
import { emitRuntime } from './emitters/runtime'

const debug = debugFactory('san-ssr:target-php')

export enum EmitContent {
    renderer = 1,
    component = 2,
    runtime = 4,

    rendererAndComponent = 3,
    all = 7
}

export type ToPHPCompilerOptions = {
    tsConfigFilePath?: string,
    project: Project
}

// TODO 确定 ToPHPCompiler 是否一次性使用，把 compile 参数挪到 constructor 参数
export default class ToPHPCompiler implements Compiler {
    private root: string
    private tsConfigFilePath: string
    private project: Project
    private phpGenerator: PHPCodeGenerator

    constructor ({
        tsConfigFilePath,
        project
    }: ToPHPCompilerOptions) {
        this.project = project
        this.root = tsConfigFilePath.split(sep).slice(0, -1).join(sep)
        this.tsConfigFilePath = tsConfigFilePath

        const tsconfig = require(this.tsConfigFilePath)
        const options = this.formatCompilerOptions(tsconfig['compilerOptions'])
        this.phpGenerator = new PHPCodeGenerator(options)
    }

    public compile (sanApp: SanApp, {
        funcName = 'render',
        noTemplateOutput = false,
        nsPrefix = 'san\\',
        emitContent = EmitContent.all,
        emitHeader = true,
        modules = {}
    }) {
        const emitter = new PHPEmitter(emitHeader)
        if (emitContent & EmitContent.renderer) {
            this.compileRenderer(emitter, funcName, nsPrefix, noTemplateOutput, sanApp)
        }
        if (emitContent & EmitContent.component) {
            this.compileProjectFiles(sanApp, emitter, nsPrefix, modules)
        }
        if (emitContent & EmitContent.runtime) {
            emitRuntime(emitter, nsPrefix + 'runtime\\')
        }
        return emitter.fullText()
    }

    public static emitRuntime ({
        emitHeader = true,
        namespace = 'san\\runtime\\'
    } = {}) {
        const emitter = new PHPEmitter(emitHeader)
        emitRuntime(emitter, namespace)
        return emitter.fullText()
    }

    public static fromSanProject (sanProject: SanProject) {
        return new ToPHPCompiler({
            project: sanProject.tsProject,
            tsConfigFilePath: sanProject.tsConfigFilePath
        })
    }

    private compileRenderer (emitter: PHPEmitter, funcName: string, nsPrefix: string, noTemplateOutput: boolean, sanApp: SanApp) {
        emitter.beginNamespace(nsPrefix + 'renderer')
        emitter.writeLine(`use ${nsPrefix}runtime\\_;`)
        emitter.carriageReturn()

        for (const componentInfo of sanApp.componentTree.preOrder()) {
            const { cid } = componentInfo
            const funcName = 'sanssrRenderer' + cid
            emitter.writeFunction(funcName, ['$data', '$noDataOutput = false', '$parentCtx = []', '$tagName = null', '$sourceSlots = []'], [], () => {
                // TODO new with tree, compile with info
                new RendererCompiler(componentInfo, emitter, noTemplateOutput, nsPrefix, sanApp.componentTree).compile()
            })
            emitter.carriageReturn()
        }
        emitter.writeFunction(funcName, ['$data', '$noDataOutput'], [], () => {
            const funcName = 'sanssrRenderer' + sanApp.componentTree.root.cid
            emitter.writeLine(`return ${funcName}($data, $noDataOutput, []);`)
        })
        emitter.endNamespace()
    }

    private formatCompilerOptions (compilerOptions = { baseUrl: '' }) {
        let baseUrl = compilerOptions.baseUrl
        if (baseUrl && !isAbsolute(baseUrl)) {
            baseUrl = resolve(this.root, baseUrl)
            compilerOptions.baseUrl = baseUrl
        }
        return compilerOptions
    }

    public compileComponent (sourceFile: SanSourceFile, emitter: PHPEmitter, nsPrefix: string, modules: Modules) {
        if (!sourceFile.tsSourceFile) return ''
        const runtimeNS = nsPrefix + 'runtime\\'

        transformAstToPHP(sourceFile)
        modules['san-ssr-target-php'] = {
            name: 'san-ssr-target-php',
            namespace: runtimeNS,
            required: true
        }

        for (const decl of getInlineDeclarations(sourceFile.tsSourceFile)) {
            const literal = decl.getModuleSpecifierValue()
            const filepath = decl.getModuleSpecifierSourceFile().getFilePath()
            const ns = nsPrefix + this.ns(filepath)

            modules[literal] = {
                name: literal,
                required: true,
                namespace: '\\' + ns + '\\'
            }
        }
        this.registerComponents(sourceFile, emitter, nsPrefix, runtimeNS)
        emitter.writeLines(this.phpGenerator.compile(
            sourceFile.tsSourceFile,
            modules,
            nsPrefix
        ))
    }

    public compileProjectFiles (entryComp: SanApp, emitter: PHPEmitter, nsPrefix: string, modules: Modules) {
        for (const [path, sourceFile] of entryComp.projectFiles) {
            emitter.writeNamespace(nsPrefix + this.ns(path), () => {
                this.compileComponent(sourceFile, emitter, nsPrefix, modules)
            })
        }
        return emitter.fullText()
    }

    private registerComponents (sourceFile: SanSourceFile, emitter: PHPEmitter, nsPrefix: string, runtimeNamespace: string) {
        for (const [cid, clazz] of sourceFile.componentClassDeclarations) {
            const classReference = `\\${nsPrefix}${this.ns(sourceFile.getFilePath())}\\${clazz.getName()}`
            emitter.writeLine(`\\${runtimeNamespace}ComponentRegistry::$comps[${cid}] = '${classReference}';`)
        }
    }

    private ns (file: string) {
        return file.slice(this.root.length, -extname(file).length)
            .split(sep)
            .map(x => this.normalizeNamespaceName(x))
            .join('\\')
            .replace(/^\\/, '')
    }

    private normalizeNamespaceName (pathname: string) {
        const name = camelCase(pathname)
        return isReserved(name) ? 'sanssrNS' + name : name
    }
}
