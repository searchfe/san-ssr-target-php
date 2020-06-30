import { readPHPSource } from '../utils/fs'
import { PHPEmitter } from './emitter'
import { resolve } from 'path'

const runtimeFiles = [
    resolve(__dirname, `../../runtime/underscore.php`),
    resolve(__dirname, `../../runtime/san.php`),
    resolve(require.resolve('ts2php'), '../runtime/Ts2Php_Helper.php')
]

export function emitHelpers (emitter: PHPEmitter) {
    for (const path of runtimeFiles) {
        emitter.writeLines(readPHPSource(path))
    }
    return emitter.fullText()
}
