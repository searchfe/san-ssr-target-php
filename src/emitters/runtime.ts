import { readPHPSource } from '../utils/fs'
import { PHPEmitter } from './emitter'
import { resolve } from 'path'

const runtimeFiles = [
    'underscore.php',
    'san.php',
    'Ts2Php_Helper.php',
    'component-registry.php'
]

export function emitRuntime (emitter: PHPEmitter, ns: string) {
    emitter.beginNamespace(ns.slice(0, -1))
    for (const file of runtimeFiles) {
        const path = resolve(__dirname, `../../runtime/${file}`)
        emitter.writeLines(readPHPSource(path).replace(/__NS__/g, ns))
    }
    emitter.endNamespace()
    return emitter.fullText()
}
