import { writeFileSync, readdirSync } from 'fs'
import { resolve, join } from 'path'
import { SanProject } from 'san-ssr'
import debugFactory from 'debug'
import ToPHPCompiler from '../index'

const debug = debugFactory('case')
export const caseRoot = resolve(__dirname, '../../node_modules/san-html-cases/src')
const tsConfigFilePath = resolve(__dirname, '../../test/tsconfig.json')
const sanProject = new SanProject(tsConfigFilePath)
const nsPrefix = 'san\\'

export function compile (caseName: string) {
    const dir = join(caseRoot, caseName)
    const files = filterSanPHPFiles(readdirSync(dir))

    for (const file of files) {
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
            ssrOnly
        }
    )
}

function filterSanPHPFiles (files: string[]) {
    const filtered = new Set(files.filter(file => isSourceFile(file)))
    removeCorrespondingJS(filtered)
    return filtered
}

function removeCorrespondingJS (files: Set<string>) {
    for (const file of files) {
        if (/\.js$/.test(file)) {
            const correspondingTS = file.replace(/\.js$/, '.ts')
            if (files.has(correspondingTS)) {
                files.delete(file)
            }
        }
    }
}

function isSourceFile (file: string) {
    return /(?<!\.d)\.ts$|component.js/.test(file) && !file.startsWith('.')
}
