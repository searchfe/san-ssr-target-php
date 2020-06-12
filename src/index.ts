import { SanProject, Compiler, SanSourceFile, SanApp, getInlineDeclarations } from 'san-ssr'
import { isReserved } from './utils/lang'
import { Modules, PHPTranspiler } from './compilers/ts2php'
import { transformAstToPHP } from './transformers/index'
import { CompilerOptions } from 'ts-morph'
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
    project: SanProject
}

export default class ToPHPCompiler implements Compiler {
    private root: string
    private tsConfigFilePath: string | null
    private project: SanProject
    private phpGenerator: PHPTranspiler

    constructor ({
        tsConfigFilePath,
        project
    }: ToPHPCompilerOptions) {
        this.project = project
        if (!tsConfigFilePath) throw new Error('tsconfig.json path is required')
        this.root = tsConfigFilePath.split(sep).slice(0, -1).join(sep)
        this.tsConfigFilePath = tsConfigFilePath

        const compilerOptions = require(tsConfigFilePath)['compilerOptions']
        const options = this.formatCompilerOptions(compilerOptions)
        this.phpGenerator = new PHPTranspiler(options)
    }

    public compile (sanApp: SanApp, {
        funcName = 'render',
        nsPrefix = 'san\\',
        emitContent = EmitContent.all,
        emitHeader = true,
        modules = {}
    }) {
        const emitter = new PHPEmitter(emitHeader, nsPrefix)
        if (emitContent & EmitContent.renderer) {
            this.compileRenderer(emitter, funcName, sanApp)
        }
        if (emitContent & EmitContent.component) {
            this.compileProjectFiles(sanApp, emitter, modules)
        }
        if (emitContent & EmitContent.runtime) {
            emitRuntime(emitter, 'runtime\\')
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
            project: sanProject,
            tsConfigFilePath: sanProject.tsConfigFilePath!
        })
    }

    private compileRenderer (emitter: PHPEmitter, funcName: string, sanApp: SanApp) {
        emitter.beginNamespace('renderer')
        emitter.writeLine(`use ${emitter.nsPrefix}runtime\\_;`)
        emitter.carriageReturn()

        const rc = new RendererCompiler(sanApp.componentTree, emitter)
        for (const componentInfo of sanApp.componentTree.preOrder()) {
            const { cid } = componentInfo
            const funcName = 'sanssrRenderer' + cid
            emitter.writeFunction(funcName, ['$data = []', '$noDataOutput = false', '$parentCtx = []', '$tagName = "div"', '$sourceSlots = []'], [], () => {
                rc.compile(componentInfo)
            })
            emitter.carriageReturn()
        }
        emitter.writeFunction(funcName, ['$data', '$noDataOutput'], [], () => {
            const funcName = 'sanssrRenderer' + sanApp.componentTree.root.cid
            emitter.writeLine(`return ${funcName}($data, $noDataOutput, []);`)
        })
        emitter.endNamespace()
    }

    private formatCompilerOptions (compilerOptions: CompilerOptions) {
        let baseUrl = compilerOptions.baseUrl
        if (baseUrl && !isAbsolute(baseUrl) && this.root) {
            baseUrl = resolve(this.root, baseUrl)
            compilerOptions.baseUrl = baseUrl
        }
        return compilerOptions
    }

    public compileProjectFile (sourceFile: SanSourceFile, emitter: PHPEmitter, modules: Modules) {
        if (!sourceFile.tsSourceFile) return ''
        const runtimeNS = emitter.nsPrefix + 'runtime\\'

        transformAstToPHP(sourceFile)
        modules['san-ssr-target-php'] = {
            name: 'san-ssr-target-php',
            namespace: runtimeNS,
            required: true
        }

        for (const decl of getInlineDeclarations(sourceFile.tsSourceFile)) {
            const literal = decl.getModuleSpecifierValue()
            const filepath = decl.getModuleSpecifierSourceFileOrThrow().getFilePath()
            const ns = emitter.nsPrefix + this.ns(filepath)

            modules[literal] = {
                name: literal,
                required: true,
                namespace: '\\' + ns + '\\'
            }
        }
        this.registerComponents(sourceFile, emitter, runtimeNS)
        emitter.writeLines(this.phpGenerator.compile(
            sourceFile.tsSourceFile,
            modules,
            emitter.nsPrefix
        ))
    }

    public compileProjectFiles (entryComp: SanApp, emitter: PHPEmitter, modules: Modules) {
        for (const [path, sourceFile] of entryComp.projectFiles) {
            emitter.writeNamespace(this.ns(path), () => {
                this.compileProjectFile(sourceFile, emitter, modules)
            })
        }
        return emitter.fullText()
    }

    private registerComponents (sourceFile: SanSourceFile, emitter: PHPEmitter, runtimeNamespace: string) {
        for (const [cid, clazz] of sourceFile.componentClassDeclarations) {
            const classReference = `\\${emitter.nsPrefix}${this.ns(sourceFile.getFilePath())}\\${clazz.getName()}`
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
