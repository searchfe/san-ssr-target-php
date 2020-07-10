/**
* 编译源码的 helper 方法集合对象
*/
import { ExprBoolNode, ExprNumberNode, ExprStringNode, ExprNode, ExprTertiaryNode, ExprBinaryNode, ExprUnaryNode, ExprInterpNode, ExprAccessorNode, ExprCallNode, ExprTextNode, ExprObjectNode, ExprArrayNode } from 'san'
import { TypeGuards, _ } from 'san-ssr'
import { Stringifier } from './stringifier'

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

export class ExprCompiler {
    constructor (
        private readonly stringifier: Stringifier
    ) {}

    // 生成数据访问表达式代码
    dataAccess (accessorExpr?: ExprAccessorNode): string {
        let code = '$ctx->data'
        for (const path of (accessorExpr ? accessorExpr.paths : [])) {
            if (TypeGuards.isExprAccessorNode(path)) {
                code += `[${this.dataAccess(path)}]`
            } else {
                code += `[${this.stringifier.any(path.value)}]`
            }
        }
        return code
    }

    // 生成调用表达式代码
    callExpr (callExpr: ExprCallNode) {
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
                code += '[' + this.compile(path) + ']'
            }
        }

        code += '('
        code += callExpr.args
            .map(arg => this.compile(arg))
            .join(', ')
        code += ')'

        return code
    }

    // 生成插值代码
    interp (interpExpr: ExprInterpNode) {
        let code = this.compile(interpExpr.expr)

        for (const filter of interpExpr.filters) {
            const filterName = filter.name.paths[0].value

            switch (filterName) {
            case '_style':
            case '_class':
                code = `_::${filterName}Filter(${code})`
                break

            case '_xstyle':
            case '_xclass':
                code = `_::${filterName}Filter(${code}, ${this.compile(filter.args[0])})`
                break

            case 'url':
                code = `encodeURIComponent(${code})`
                break

            default:
                code = `_::callFilter($ctx, "${filterName}", [${code}`
                for (const arg of filter.args) {
                    code += ', ' + this.compile(arg)
                }
                code += '])'
            }
        }

        if (!interpExpr.original) {
            return `_::escapeHTML(${code})`
        }

        return code
    }

    str (e: ExprStringNode | ExprNumberNode | ExprBoolNode): string {
        return this.stringifier.str(_.escapeHTML(e.value))
    }

    number (e: ExprNumberNode) {
        return this.stringifier.number(e.value)
    }

    // 生成文本片段代码
    text (textExpr: ExprTextNode) {
        if (textExpr.segs.length === 0) {
            return `''`
        }

        return textExpr.segs
            .map(seg => this.compile(seg))
            .map(seg => `(${seg})`)
            .join(' . ')
    }

    // 生成数组字面量代码
    array (arrayExpr: ExprArrayNode) {
        const items = []
        let spread = ''

        for (const item of arrayExpr.items) {
            items.push(this.compile(item.expr))
            spread += item.spread ? 1 : 0
        }

        return `_::spread([${items.join(', ')}], '${spread}')`
    }

    // 生成对象字面量代码
    object (objExpr: ExprObjectNode) {
        const items = []
        let spread = ''

        for (const item of objExpr.items) {
            if (item.spread) {
                spread += 1
                items.push(this.compile(item.expr))
            } else {
                spread += 0
                const key = this.compile(item.name)
                const val = this.compile(item.expr)
                items.push(`[${key}, ${val}]`)
            }
        }
        return `_::objSpread([${items.join(', ')}], '${spread}')`
    }

    unary (e: ExprUnaryNode) {
        if (e.operator === 33) return '!' + this.compile(e.expr)
        if (e.operator === 45) return '-' + this.compile(e.expr)
        throw new Error(`unexpected unary operator "${String.fromCharCode(e.operator)}"`)
    }

    binary (e: ExprBinaryNode) {
        const lhs = this.compile(e.segs[0])
        const rhs = this.compile(e.segs[1])
        const op = binaryOp[e.operator]
        if (op === '||') {
            return `(${lhs} ? ${lhs} : ${rhs})`
        }
        return `${lhs} ${op} ${rhs}`
    }

    tertiary (e: ExprTertiaryNode) {
        return this.compile(e.segs[0]) +
            '?' + this.compile(e.segs[1]) +
            ':' + this.compile(e.segs[2])
    }

    compile (e: ExprNode): string {
        const str = this.dispatch(e)
        return e.parenthesized ? `(${str})` : str
    }

    // 根据表达式类型进行生成代码函数的中转分发
    private dispatch (e: ExprNode): string {
        if (TypeGuards.isExprUnaryNode(e)) return this.unary(e)
        if (TypeGuards.isExprBinaryNode(e)) return this.binary(e)
        if (TypeGuards.isExprTertiaryNode(e)) return this.tertiary(e)
        if (TypeGuards.isExprStringNode(e)) return this.str(e)
        if (TypeGuards.isExprNumberNode(e)) return this.number(e)
        if (TypeGuards.isExprBoolNode(e)) return e.value ? 'true' : 'false'
        if (TypeGuards.isExprAccessorNode(e)) return this.dataAccess(e)
        if (TypeGuards.isExprInterpNode(e)) return this.interp(e)
        if (TypeGuards.isExprTextNode(e)) return this.text(e)
        if (TypeGuards.isExprArrayNode(e)) return this.array(e)
        if (TypeGuards.isExprObjectNode(e)) return this.object(e)
        if (TypeGuards.isExprCallNode(e)) return this.callExpr(e)
        if (TypeGuards.isExprNullNode(e)) return 'null'
        throw new Error(`unexpected expression ${JSON.stringify(e)}`)
    }
}
