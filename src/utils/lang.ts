import { getRefactoredName } from '../transformers/refactor-reserved-names'
import { join, relative, dirname } from 'path'

/**
 * PHP 关键字
 *
 * See https://www.php.net/manual/en/reserved.keywords.php
 */
const rKeyword = /\b((a(bstract|nd|rray|s))|(c(a(llable|se|tch)|l(ass|one)|on(st|tinue)))|(d(e(clare|fault)|ie|o))|(e(cho|lse(if)?|mpty|nd(declare|for(each)?|if|switch|while)|val|x(it|tends)))|(f(inal|or(each)?|unction))|(g(lobal|oto))|(i(f|mplements|n(clude(_once)?|st(anceof|eadof)|terface)|sset))|(n(amespace|ew))|(p(r(i(nt|vate)|otected)|ublic))|(re(quire(_once)?|turn))|(s(tatic|witch))|(t(hrow|r(ait|y)))|(u(nset|se))|(__halt_compiler|break|list|(x)?or|var|while))\b/i

/**
 * PHP label 规范（包括变量名、命名空间名）首字母、其他字母
 *
 * See https://www.php.net/manual/en/language.variables.basics.php
 */
const rLabelStart = /[a-zA-Z_\x80-\xff]/
const rLabelContent = /[a-zA-Z0-9_\x80-\xff]/

export function resolveFrom (current: string, relative: string) {
    return join(dirname(current), relative)
}

export function getNamespace (prefix: string, root: string, filename: string) {
    return prefix + relative(root, filename.replace(/\.(ts|js)$/, ''))
        .replace(/\//g, '\\')
        .split('\\')
        .map(x => normalizeNamespaceSlug(x))
        .join('\\')
}

export function normalizeNamespaceSlug (slug: string) {
    let ans = ''
    for (let i = 0; i < slug.length; i++) {
        const isValid = i === 0
            ? rLabelStart.test(slug[i])
            : rLabelContent.test(slug[i])
        ans += isValid ? slug[i] : '_'
    }
    /**
     * 要先消毒，再判断是否冲突。
     * 因为消毒后可能就不冲突了，例如：class-a 冲突，消毒后 class_a 不冲突
     */
    ans = isReservedInPHP(ans) ? getRefactoredName(ans) : ans
    return ans
}

/**
 * 返回 `name` 是否是 PHP 中的关键字，比如 list、require。
 */
export function isReservedInPHP (name: string) {
    return rKeyword.test(name)
}
