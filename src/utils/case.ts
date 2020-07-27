import { writeFileSync, readdirSync } from 'fs'
import { resolve, join } from 'path'
import { SanProject } from 'san-ssr'
import debugFactory from 'debug'
import ToPHPCompiler from '../index'

const debug = debugFactory('case')
const caseRoot = resolve(__dirname, '../../test/cases')
const tsConfigFilePath = resolve(__dirname, '../../test/tsconfig.json')
const sanProject = new SanProject(tsConfigFilePath)
const nsPrefix = 'san\\'

export function compile (caseName: string) {
    const dir = join(caseRoot, caseName)
    const files = readdirSync(dir).filter(x => /\.(ts|js)$/.test(x))

    for (const file of files) {
        if (/\.d\.ts$/.test(file)) continue
        const src = join(dir, file)
        const dst = join(dir, file.replace(/\.(ts|js)$/, '.php'))
        writeFileSync(dst, compileComponentFile(src))
    }
}

export function compileComponentFile (filepath: string): string {
    const ssrOnly = /-so/.test(filepath)
    return sanProject.compile(
        filepath,
        ToPHPCompiler,
        {
            nsPrefix,
            nsRootDir: caseRoot,
            importHelpers: '\\san\\helpers',
            ssrOnly,
            modules: {
                './php': {
                    required: true
                },
                '@cases/multi-files': {
                    path: join(__dirname, '../../test/cases/multi-files')
                },
                '@cases/multi-component-files': {
                    path: join(__dirname, '../../test/cases/multi-component-files')
                }
            },
            getModuleNamespace: (moduleSpecifier: string) => {
                if (/^@cases/.test(moduleSpecifier)) {
                    return moduleSpecifier.replace(/^@cases/, '\\san').replace(/-/g, '_').replace(/\//g, '\\') + '\\'
                }
                return ''
            }
        }
    )
}
