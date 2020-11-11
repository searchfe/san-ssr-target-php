/**
 * 把 ExprNode 转为 PHP 表达式
 */
import { ExprNumberNode, ExprStringNode, ExprNode, ExprTertiaryNode, ExprBinaryNode, ExprUnaryNode, ExprInterpNode, ExprAccessorNode, ExprCallNode, ExprTextNode, ExprObjectNode, ExprArrayNode } from 'san'
import { TypeGuards, _ } from 'san-ssr'
import { Stringifier } from './stringifier'

export type OutputType = 'plain' | 'escape' | 'none'

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
    dataAccess (accessorExpr: ExprAccessorNode | undefined, output: OutputType): string {
        let code = '$ctx->data'
        for (const path of (accessorExpr ? accessorExpr.paths : [])) {
            if (TypeGuards.isExprAccessorNode(path)) {
                code += `[${this.dataAccess(path, 'none')}]`
            } else {
                code += `[${this.stringifier.any(path.value)}]`
            }
        }
        return outputCode(code, output)
    }

    // 生成调用表达式代码
    callExpr (callExpr: ExprCallNode, output: OutputType) {
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

        return outputCode(code, output)
    }

    /*
     * 生成插值代码，需要处理转义，几个场景
     *
     * - 并非所有表达式都需要转义，例如：
     *     ExprTextNode[text=Hi {{san}}!]，只有其中的 ExprInterpNode[{{san}}] 部分需要转义
     * - 插值有时不需要转义，比如：
     *     <x-list list={{data | square}}></x-list>，list 作为数据传递给 <x-list> 时不转义
     */
    interp (interpExpr: ExprInterpNode, output: OutputType) {
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
        if (output === 'escape' && interpExpr.original) output = 'plain'
        return outputCode(code, output)
    }

    /**
     * 常量字符串生成 PHP 表达式（字面量语法），需要处理转义。几个场景：
     *
     * - 作为 PHP 语句的一部分时，不需要转义。
     * - 输出到 HTML 时，需要转义。
     */
    str (e: ExprStringNode, output: OutputType): string {
        return output === 'escape'
            ? this.stringifier.str(_.escapeHTML(e.value))
            : this.stringifier.str(e.value)
    }

    number (e: ExprNumberNode) {
        return this.stringifier.number(e.value)
    }

    /*
     * 生成文本片段代码，需要支持转义和不转义两种模式
     *
     * class="{{foo}} bar" 不转义（可能有嵌套），最后在 attrFilter 中转义。
     * <div>{{foo}} bar</div>，foo 和 bar 都需要转义。
     */
    text (textExpr: ExprTextNode, output: OutputType) {
        return textExpr.segs
            .map(seg => this.compile(seg, output))
            .map(seg => `${seg}`)
            .join(' . ') || '""'
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

    binary (e: ExprBinaryNode, output: OutputType) {
        const lhs = this.compile(e.segs[0])
        const rhs = this.compile(e.segs[1])
        let op = binaryOp[e.operator]
        if (op === '||') return `(${lhs} ? ${lhs} : ${rhs})`
        if (TypeGuards.isExprStringNode(e.segs[0]) || TypeGuards.isExprStringNode(e.segs[1])) {
            op = '.'
        }
        return outputCode(`${lhs} ${op} ${rhs}`, output)
    }

    tertiary (e: ExprTertiaryNode) {
        return this.compile(e.segs[0]) +
            '?' + this.compile(e.segs[1]) +
            ':' + this.compile(e.segs[2])
    }

    compile (e: ExprNode, output: OutputType = 'none'): string {
        let code = ''
        if (TypeGuards.isExprUnaryNode(e)) code = this.unary(e)
        else if (TypeGuards.isExprBinaryNode(e)) code = this.binary(e, output)
        else if (TypeGuards.isExprTertiaryNode(e)) code = this.tertiary(e)
        else if (TypeGuards.isExprStringNode(e)) code = this.str(e, output)
        else if (TypeGuards.isExprNumberNode(e)) code = this.number(e)
        else if (TypeGuards.isExprBoolNode(e)) code = e.value ? 'true' : 'false'
        else if (TypeGuards.isExprAccessorNode(e)) code = this.dataAccess(e, output)
        else if (TypeGuards.isExprInterpNode(e)) code = this.interp(e, output)
        else if (TypeGuards.isExprTextNode(e)) code = this.text(e, output)
        else if (TypeGuards.isExprArrayNode(e)) code = this.array(e)
        else if (TypeGuards.isExprObjectNode(e)) code = this.object(e)
        else if (TypeGuards.isExprCallNode(e)) code = this.callExpr(e, output)
        else if (TypeGuards.isExprNullNode(e)) code = 'null'
        else throw new Error(`unexpected expression ${JSON.stringify(e)}`)
        return e.parenthesized ? `(${code})` : code
    }
}

function outputCode (code: string, output: OutputType) {
    if (output === 'none') return code
    return `_::output(${code}, ${output === 'escape'})`
}
