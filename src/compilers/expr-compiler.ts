/**
* 编译源码的 helper 方法集合对象
*/
import { ExprNode, ExprTertiaryNode, ExprBinaryNode, ExprUnaryNode, ExprInterpNode, ExprAccessorNode, ExprCallNode, ExprTextNode, ExprObjectNode, ExprArrayNode } from 'san'
import { TypeGuards } from 'san-ssr'

// 二元表达式操作符映射表
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

// 字符串字面化
export function stringLiteralize (source: string) {
    return '"' + source
        .replace(/\x5C/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/(\\)?\$/g, '\\$$') // php 变量解析 fix, 方案同 ts2php
        .replace(/\n/g, '\\n')
        .replace(/\t/g, '\\t')
        .replace(/\r/g, '\\r') + '"'
}

// 生成数据访问表达式代码
export function dataAccess (accessorExpr?: ExprAccessorNode): string {
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

// 生成调用表达式代码
function callExpr (callExpr: ExprCallNode) {
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

// 生成插值代码
function interp (interpExpr: ExprInterpNode) {
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

// 生成文本片段代码
function text (textExpr: ExprTextNode) {
    if (textExpr.segs.length === 0) {
        return '""'
    }

    return textExpr.segs
        .map(seg => expr(seg))
        .map(seg => `(${seg})`)
        .join(' . ')
}

// 生成数组字面量代码
function array (arrayExpr: ExprArrayNode) {
    const items = []
    const spread = []

    for (const item of arrayExpr.items) {
        items.push(expr(item.expr))
        spread.push(item.spread ? 1 : 0)
    }

    return `_::spread([${items.join(', ')}], ${JSON.stringify(spread)})`
}

// 生成对象字面量代码
function object (objExpr: ExprObjectNode) {
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

function unary (e: ExprUnaryNode) {
    if (e.operator === 33) return '!' + expr(e.expr)
    if (e.operator === 45) return '-' + expr(e.expr)
    return ''
}

function binary (e: ExprBinaryNode) {
    const [lhs, rhs] = e.segs
    return expr(lhs) + binaryOp[e.operator] + expr(rhs)
}

function tertiary (e: ExprTertiaryNode) {
    return expr(e.segs[0]) +
        '?' + expr(e.segs[1]) +
        ':' + expr(e.segs[2])
}

export function expr (e: ExprNode): string {
    const str = dispatch(e)
    return e.parenthesized ? `(${str})` : str
}

// 根据表达式类型进行生成代码函数的中转分发
function dispatch (e: ExprNode): string {
    if (TypeGuards.isExprUnaryNode(e)) return unary(e)
    if (TypeGuards.isExprBinaryNode(e)) return binary(e)
    if (TypeGuards.isExprTertiaryNode(e)) return tertiary(e)
    if (TypeGuards.isExprStringNode(e)) return stringLiteralize(e.literal || e.value)
    if (TypeGuards.isExprNumberNode(e)) return '' + e.value
    if (TypeGuards.isExprBoolNode(e)) return e.value ? 'true' : 'false'
    if (TypeGuards.isExprAccessorNode(e)) return dataAccess(e)
    if (TypeGuards.isExprInterpNode(e)) return interp(e)
    if (TypeGuards.isExprTextNode(e)) return text(e)
    if (TypeGuards.isExprArrayNode(e)) return array(e)
    if (TypeGuards.isExprObjectNode(e)) return object(e)
    if (TypeGuards.isExprCallNode(e)) return callExpr(e)
    if (TypeGuards.isExprNullNode(e)) return 'null'
    throw new Error(`unexpected expression ${e}`)
}
