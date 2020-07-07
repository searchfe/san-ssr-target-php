import { getRefactoredName } from '../transformers/refactor-reserved-names'
import { relative } from 'path'
import camelCase from 'camelcase'

const reservedNames = [/^list$/i]

export function getNamespace (prefix: string, root: string, filename: string) {
    return prefix + relative(root, filename.replace(/\.(ts|js)$/, ''))
        .replace(/\//g, '\\')
        .split('\\')
        .map(x => normalizeNamespaceSlug(x))
        .join('\\')
}

export function normalizeNamespaceSlug (slug: string) {
    const name = camelCase(slug)
    return isReservedInPHP(name) ? getRefactoredName(name) : name
}

/**
 * 返回 `name` 是否是 PHP 中的保留字，比如 list、require。
 */
export function isReservedInPHP (name: string) {
    for (const reserved of reservedNames) {
        if (reserved.test(name)) return true
    }
    return false
}
