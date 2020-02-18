/**
* 编译源码的 helper 方法集合对象
*/
import { ExprNode, ExprAccessorNode } from 'san'
import { TypeGuards } from 'san-ssr'

/**
 * 字符串字面化
 *
 * @param {string} source 需要字面化的字符串
 * @return {string} 字符串字面化结果
 */
export function stringLiteralize (source: string) {
    return '"' + source
        .replace(/\x5C/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/(\\)?\$/g, '\\$$') // php 变量解析 fix, 方案同 ts2php
        .replace(/\n/g, '\\n')
        .replace(/\t/g, '\\t')
        .replace(/\r/g, '\\r') + '"'
}

/**
 * 生成数据访问表达式代码
 *
 * @param {Object?} accessorExpr accessor表达式对象
 * @return {string}
 */
export function dataAccess (accessorExpr?: any): string {
    const seq = []
    for (const path of (accessorExpr ? accessorExpr.paths : [])) {
        if (TypeGuards.isExprAccessorNode(path)) {
            seq.push(dataAccess(path))
        } else if (typeof path.value === 'string') {
            seq.push(`"${path.value}"`)
        } else if (typeof path.value === 'number') {
            seq.push(path.value)
        }
    }
    return `_::data($ctx, [${seq.join(', ')}])`
}

/**
 * 生成调用表达式代码
 *
 * @param {Object?} callExpr 调用表达式对象
 * @return {string}
 */
function callExpr (callExpr) {
    const paths = callExpr.name.paths
    let code = `$ctx->instance->${paths[0].value}`

    for (let i = 1; i < paths.length; i++) {
        const path = paths[i]

        switch (path.type) {
        case 1:
            code += '.' + path.value
            break

        case 2:
            code += '[' + path.value + ']'
            break

        default:
            code += '[' + expr(path) + ']'
        }
    }

    code += '('
    code += callExpr.args
        .map(arg => expr(arg))
        .join(',')
    code += ')'

    return code
}

/**
 * 生成插值代码
 *
 * @param {Object} interpExpr 插值表达式对象
 * @return {string}
 */
function interp (interpExpr) {
    let code = expr(interpExpr.expr)

    for (const filter of interpExpr.filters) {
        const filterName = filter.name.paths[0].value

        switch (filterName) {
        case '_style':
        case '_class':
            code = `_::${filterName}Filter(${code})`
            break

        case '_xstyle':
        case '_xclass':
            code = `_::${filterName}Filter(${code}, ${expr(filter.args[0])})`
            break

        case 'url':
            code = `encodeURIComponent(${code})`
            break

        default:
            code = `_::callFilter($ctx, "${filterName}", [${code}`
            for (const arg of filter.args) {
                code += ', ' + expr(arg)
            }
            code += '])'
        }
    }

    if (!interpExpr.original) {
        return `_::escapeHTML(${code})`
    }

    return code
}

/**
 * 生成文本片段代码
 *
 * @param {Object} textExpr 文本片段表达式对象
 * @return {string}
 */
function text (textExpr) {
    if (textExpr.segs.length === 0) {
        return '""'
    }

    return textExpr.segs
        .map(seg => expr(seg))
        .map(seg => `(${seg})`)
        .join(' . ')
}

/**
 * 生成数组字面量代码
 *
 * @param {Object} arrayExpr 数组字面量表达式对象
 * @return {string}
 */
function array (arrayExpr) {
    const items = []
    const spread = []

    for (const item of arrayExpr.items) {
        items.push(expr(item.expr))
        spread.push(item.spread ? 1 : 0)
    }

    return `_::spread([${items.join(', ')}], ${JSON.stringify(spread)})`
}

/**
 * 生成对象字面量代码
 *
 * @param {Object} objExpr 对象字面量表达式对象
 * @return {string}
 */
function object (objExpr) {
    const items = []
    const spread = []

    for (const item of objExpr.items) {
        if (item.spread) {
            spread.push(1)
            items.push(expr(item.expr))
        } else {
            spread.push(0)
            const key = expr(item.name)
            const val = expr(item.expr)
            items.push(`[${key}, ${val}]`)
        }
    }
    return `_::objSpread([${items.join(',')}], ${JSON.stringify(spread)})`
}

/**
 * 二元表达式操作符映射表
 *
 * @type {Object}
 */
const binaryOp = {
    43: '+',
    45: '-',
    42: '*',
    47: '/',
    60: '<',
    62: '>',
    76: '&&',
    94: '!=',
    121: '<=',
    122: '==',
    123: '>=',
    155: '!==',
    183: '===',
    248: '||'
}

/**
 * 生成表达式代码
 *
 * @param {Object} expr 表达式对象
 * @return {string}
 */
export function expr (e) {
    if (e.parenthesized) {
        return '(' + _expr(e) + ')'
    }

    return _expr(e)
}

/**
 * 根据表达式类型进行生成代码函数的中转分发
 *
 * @param {Object} expr 表达式对象
 * @return {string}
 */
function _expr (e: any) {
    // TODO introduce typeguards
    switch (e.type) {
    case 9:
        switch (e.operator) {
        case 33:
            return '!' + expr(e.expr)
        case 45:
            return '-' + expr(e.expr)
        }
        return ''

    case 8:
        return expr(e.segs[0]) +
            binaryOp[e.operator] +
            expr(e.segs[1])

    case 10:
        return expr(e.segs[0]) +
            '?' + expr(e.segs[1]) +
            ':' + expr(e.segs[2])

    case 1:
        return stringLiteralize(e.literal || e.value)

    case 2:
        return e.value

    case 3:
        return e.value ? 'true' : 'false'

    case 4:
        return dataAccess(e)

    case 5:
        return interp(e)

    case 7:
        return text(e)

    case 12:
        return array(e)

    case 11:
        return object(e)

    case 6:
        return callExpr(e)

    case 13:
        return 'null'
    }
}
