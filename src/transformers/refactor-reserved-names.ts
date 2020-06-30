import { TypedSanSourceFile } from 'san-ssr'
const reservedNames = [/^list$/i]

/**
 * 返回 `name` 是否是 PHP 中的保留字，比如 list、require。
 */
export function isReservedInPHP (name: string) {
    for (const reserved of reservedNames) {
        if (reserved.test(name)) return true
    }
    return false
}

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
