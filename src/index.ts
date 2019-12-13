import { SanProject, Compiler, SanSourceFile, SanApp, getInlineDeclarations } from 'san-ssr'
import { keyBy } from 'lodash'
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
    rendererAndComponent = 3,
    runtime = 4,
    all = 7
}

export type ToPHPCompilerOptions = {
    tsConfigFilePath?: string,
    project: Project
}

export default class ToPHPCompiler implements Compiler {
    private root: string
    private tsConfigFilePath: string
    private ts2phpModules: Modules
    private project: Project
    private phpGenerator: PHPCodeGenerator

    constructor ({
        tsConfigFilePath,
        project
    }: ToPHPCompilerOptions) {
        this.project = project
        this.ts2phpModules = keyBy([{
            name: 'san',
            required: true,
            namespace: '\\san\\runtime\\' // TODO what's this
        }], 'name')
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
            this.compileComponents(sanApp, emitter, nsPrefix, modules)
        }
        if (emitContent & EmitContent.runtime) {
            emitRuntime(emitter, nsPrefix)
        }
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

        for (let i = 0; i < sanApp.componentClasses.length; i++) {
            const componentClass = sanApp.componentClasses[i]
            const funcName = 'sanssrRenderer' + componentClass.sanssrCid
            emitter.writeFunction(funcName, ['$data', '$noDataOutput = false', '$parentCtx = []', '$tagName = null', '$sourceSlots = []'], [], () => {
                new RendererCompiler(componentClass, emitter, noTemplateOutput, nsPrefix).compile()
            })
            emitter.carriageReturn()
        }
        emitter.writeFunction(funcName, ['$data', '$noDataOutput'], [], () => {
            const funcName = 'sanssrRenderer' + sanApp.getEntryComponentClassOrThrow().sanssrCid
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

    public compileComponent (sourceFile: SanSourceFile, nsPrefix: string, modules: Modules) {
        if (!sourceFile.tsSourceFile) return ''

        transformAstToPHP(sourceFile)
        modules = { ...this.ts2phpModules, ...modules }

        modules['san-ssr'] = {
            name: 'san-ssr',
            namespace: nsPrefix + 'runtime\\',
            required: true
        }
        for (const decl of getInlineDeclarations(sourceFile.tsSourceFile)) {
            const ns = nsPrefix + this.ns(decl.getModuleSpecifierSourceFile().getFilePath())
            const literal = decl.getModuleSpecifierValue()
            modules[literal] = {
                name: literal,
                required: true,
                namespace: '\\' + ns + '\\'
            }
        }
        return this.phpGenerator.compile(
            sourceFile.tsSourceFile,
            modules,
            nsPrefix
        )
    }

    public compileComponents (entryComp: SanApp, emitter: PHPEmitter, nsPrefix: string, modules: Modules) {
        for (const [path, sourceFile] of entryComp.projectFiles) {
            emitter.beginNamespace(nsPrefix + this.ns(path))
            emitter.writeLine(`use ${nsPrefix}runtime\\_;`)
            emitter.writeLines(this.compileComponent(sourceFile, nsPrefix, modules))

            for (const [cid, clazz] of sourceFile.componentClassDeclarations) {
                const classReference = `\\${nsPrefix}${this.ns(sourceFile.getFilePath())}\\${clazz.getName()}`
                emitter.writeLine(`\\${nsPrefix}runtime\\ComponentRegistry::$comps[${cid}] = '${classReference}';`)
            }

            emitter.endNamespace()
        }
        return emitter.fullText()
    }

    private ns (file: string) {
        const escapeName = x => isReserved(x) ? 'sanssrNS' + camelCase(x) : x
        return file
            .slice(this.root.length, -extname(file).length)
            .split(sep).map(x => camelCase(x)).map(escapeName).join('\\')
            .replace(/^\\/, '')
    }
}
