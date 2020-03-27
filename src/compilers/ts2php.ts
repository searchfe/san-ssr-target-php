import { Ts2Php } from 'ts2php'
import { SourceFile, CompilerOptions } from 'ts-morph'
import debugFactory from 'debug'

const debug = debugFactory('san-ssr:ts2php')

export interface Modules {
    [key:string]: ModuleInfo
}

type ModuleInfo = {
    name: string,
    required?: boolean,
    path?: string,
    namespace?: string
}

export class PHPTranpiler {
    private ts2php: Ts2Php

    constructor (compilerOptions: CompilerOptions) {
        debug('compilerOptions:', compilerOptions)
        this.ts2php = new Ts2Php({ compilerOptions })
    }

    compile (sourceFile: SourceFile, modules: Modules, nsPrefix: string) {
        debug('compile', sourceFile.getFilePath(), 'options:', modules)
        debug('source code:', sourceFile.getFullText())

        const options = {
            source: sourceFile.getFullText(),
            emitHeader: false,
            plugins: [],
            modules,
            helperNamespace: `\\${nsPrefix}runtime\\`
        }
        const { errors, phpCode } = this.ts2php.compile(sourceFile.getFilePath(), options)
        if (errors.length) {
            const error = errors[0]
            throw new Error(error.msg || error['messageText'])
        }
        debug('target code:', phpCode)
        return phpCode
    }
}
