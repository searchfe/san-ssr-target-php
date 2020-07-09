import { Ts2Php } from 'ts2php'
import { SourceFile } from 'ts-morph'
import debugFactory from 'debug'

const debug = debugFactory('san-ssr:ts2php')

export interface Modules {
    [key:string]: ModuleInfo
}

type ModuleInfo = {
    name: string,
    required?: boolean,
    used?: boolean,
    path?: string,
    namespace?: string
}

export class PHPTranspiler {
    private ts2php: Ts2Php

    constructor (compilerOptions = {}) {
        debug('compilerOptions:', compilerOptions)
        compilerOptions['noUnusedLocals'] = false
        this.ts2php = new Ts2Php({ compilerOptions })
    }

    compile (sourceFile: SourceFile, modules: Modules, helperNamespace: string) {
        const options = {
            source: sourceFile.getFullText(),
            emitHeader: false,
            plugins: [],
            modules,
            helperNamespace: `${helperNamespace}\\`
        }
        debug('compile', sourceFile.getFilePath(), 'options:', options)
        const { errors, phpCode } = this.ts2php.compile(sourceFile.getFilePath(), options)
        if (errors.length) {
            const error = errors[0]
            throw new Error(String(error.messageText))
        }
        debug('target code:', phpCode)
        return phpCode
    }
}
