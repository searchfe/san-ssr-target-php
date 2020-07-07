import { TypedSanSourceFile } from 'san-ssr'
import { isReservedInPHP } from '../utils/lang'

/**
 * 映射后的名字
 */
export function getRefactoredName (name: string) {
    return `SanSSRClass${name}`
}

/**
 * 对 PHP 中不合法的类名进行 AST 重构
 */
export function refactorReservedNames (sourceFile: TypedSanSourceFile) {
    for (const clazz of sourceFile.getComponentClassDeclarations()) {
        const name = clazz.getName()
        if (name && isReservedInPHP(name)) {
            clazz.rename(getRefactoredName(name))
        }
    }
}
