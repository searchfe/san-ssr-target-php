import { Emitter, ComponentInfo, TypedComponentInfo, SyntaxKind, Expression, Statement, FunctionDefinition, VariableDefinition, Literal, MapLiteral, ArrayLiteral, UnaryExpression, Foreach, BinaryExpression, SlotRendererDefinition, assertNever } from 'san-ssr'
import { Stringifier } from './stringifier'
import { ReferenceCompiler } from './reference-compiler'
export class PHPEmitter extends Emitter {
    private stringifier: Stringifier
    private referenceCompiler?: ReferenceCompiler

    /**
     * @param emitHeader 输出 PHP 头 `<?php`
     * @param helpersNamespace helpers 所在的命名空间
     */
    constructor (emitHeader = false, public helpersNamespace = '') {
        super()
        if (emitHeader) this.writeLine('<?php')
        this.stringifier = new Stringifier(helpersNamespace)
    }

    public setReferenceCompiler (referenceCompiler: ReferenceCompiler) {
        this.referenceCompiler = referenceCompiler
    }

    public writeSyntaxNode (node: Expression | Statement) {
        switch (node.kind) {
        case SyntaxKind.Literal:
            return this.writeLiteral(node)
        case SyntaxKind.Identifier:
            if (['>'].indexOf(this.lastChar()) < 0) {
                this.write('$')
            }
            this.write(node.name)
            break
        case SyntaxKind.ArrayIncludes:
            this.write('_::contains(')
            this.writeSyntaxNode(node.arr)
            this.write(', ')
            this.writeSyntaxNode(node.item)
            this.write(')')
            break
        case SyntaxKind.MapAssign:
            this.write('_::extend(')
            this.writeExpressionList([node.dest, ...node.srcs])
            this.write(')')
            break
        case SyntaxKind.RegexpReplace:
            this.write(`preg_replace('/${node.pattern}/', `)
            this.writeSyntaxNode(node.replacement)
            this.write(', ')
            this.writeSyntaxNode(node.original)
            this.write(')')
            break
        case SyntaxKind.JSONStringify:
            this.write('_::json_encode(')
            this.writeSyntaxNode(node.value)
            this.write(')')
            break
        case SyntaxKind.BinaryExpression:
            this.writeBinaryExpression(node)
            break
        case SyntaxKind.ConditionalExpression:
            this.writeSyntaxNode(node.cond)
            this.write(' ? ')
            this.writeSyntaxNode(node.trueValue)
            this.write(' : ')
            this.writeSyntaxNode(node.falseValue)
            break
        case SyntaxKind.EncodeURIComponent:
            this.write('encodeURIComponent(')
            this.writeSyntaxNode(node.value)
            this.write(')')
            break
        case SyntaxKind.ComputedCall:
            this.write(`$instance->data->get("${node.name}")`)
            break
        case SyntaxKind.FilterCall:
            this.write(`_::callFilter($ctx, "${node.name}", [`)
            this.writeExpressionList(node.args)
            this.write('])')
            break
        case SyntaxKind.GetRootCtxCall:
            this.write('_::getRootContext(')
            this.writeExpressionList(node.args)
            this.write(')')
            break
        case SyntaxKind.HelperCall:
            this.write('_::')
            this.write(node.name)
            this.write('(')
            this.writeExpressionList(node.args)
            this.write(')')
            break
        case SyntaxKind.FunctionDefinition:
            return this.writeFunctionDefinition(node)
        case SyntaxKind.SlotRendererDefinition:
            return this.writeFunctionDefinition(node, ['&$ctx'])
        case SyntaxKind.FunctionCall:
            if (node.fn.kind === SyntaxKind.ComponentRendererReference) {
                this.write('call_user_func(')
                this.writeSyntaxNode(node.fn)
                this.write(', ')
            } else {
                this.writeSyntaxNode(node.fn)
                this.write('(')
            }
            this.writeExpressionList(node.args)
            this.write(')')
            break
        case SyntaxKind.SlotRenderCall:
            this.write('_::callSlotRender(')
            this.writeSyntaxNode(node.fn)
            this.write(', [')
            this.writeExpressionList(node.args)
            this.write('])')
            break
        case SyntaxKind.CreateComponentInstance:
            this.createComponentInstance(node.info)
            break
        case SyntaxKind.Null:
            this.write('null')
            break
        case SyntaxKind.NewExpression:
            this.write('new ')
            if (node.name.kind === SyntaxKind.Identifier) {
                this.write(node.name.name)
            } else {
                this.writeSyntaxNode(node.name)
            }
            this.write('(')
            this.writeExpressionList(node.args)
            this.write(')')
            break
        case SyntaxKind.UnaryExpression:
            return this.writeUnaryExpression(node)
        case SyntaxKind.ArrayLiteral:
            return this.writeArrayLiteral(node)
        case SyntaxKind.MapLiteral:
            return this.writeMapLiteral(node)
        case SyntaxKind.ComponentRendererReference:
            this.writeSyntaxNode(node.value)
            break
        case SyntaxKind.ComponentReferenceLiteral:
            if (!this.referenceCompiler) {
                throw new Error('referenceCompiler is required')
            }
            this.write('\'')
            this.write(this.referenceCompiler.compileToFunctionFullName(node.value))
            this.write('\'')
            break
        case SyntaxKind.ReturnStatement:
            this.nextLine('return ')
            this.writeSyntaxNode(node.value)
            this.feedLine(';')
            break
        case SyntaxKind.ExpressionStatement:
            this.nextLine('')
            this.writeSyntaxNode(node.value)
            this.feedLine(';')
            break
        case SyntaxKind.ImportHelper:
            break
        case SyntaxKind.AssignmentStatement:
            this.nextLine('')
            this.writeSyntaxNode(node.lhs)
            this.write(' = ')
            /**
             * @deprecated 为了兼容 2.5.0 以下版本的 $slots 数据格式
             */
            if (node.rhs.kind === SyntaxKind.SlotRendererDefinition) {
                this.write('[')
                this.writeSyntaxNode(node.rhs)
                this.write(']')
            } else {
                this.writeSyntaxNode(node.rhs)
            }
            this.feedLine(';')
            break
        case SyntaxKind.VariableDefinition:
            this.writeVariableDefinition(node)
            break
        case SyntaxKind.If:
            this.nextLine('if (')
            this.writeSyntaxNode(node.cond)
            this.write(') ')
            this.writeBlockStatements(node.body)
            break
        case SyntaxKind.ElseIf:
            this.nextLine('else if (')
            this.writeSyntaxNode(node.cond)
            this.write(') ')
            this.writeBlockStatements(node.body)
            break
        case SyntaxKind.Else:
            this.nextLine('else ')
            this.writeBlockStatements(node.body)
            break
        case SyntaxKind.Foreach:
            return this.writeForeachStatement(node)
        default: assertNever(node)
        }
    }

    /**
     * 把一个字面量对象按 JS 语法输出。例如：{ foo: new Date(333) }
     */
    private writeLiteral (node: Literal) {
        const str = this.stringifier.any(node.value)
        return this.write(str)
    }

    private writeObjSpread (node: MapLiteral) {
        this.write('_::objSpread([')
        let first = true
        let spreadArgs = ''
        for (const [k, v, spread] of node.items) {
            if (!first) {
                this.write(', ')
            }
            if (spread) {
                spreadArgs += '1'
                this.writeSyntaxNode(v)
            } else {
                spreadArgs += '0'
                this.write('[')
                this.writeSyntaxNode(k)
                this.write(', ')
                this.writeSyntaxNode(v)
                this.write(']')
            }
            first = false
        }
        this.write(`], "${spreadArgs}")`)
    }

    private writeMapLiteral (node: MapLiteral) {
        if (node.items.some(([,, spread]) => spread)) {
            return this.writeObjSpread(node)
        }
        let first = true
        this.write('[')
        for (const [k, v] of node.items) {
            if (!first) this.write(', ')
            if (k.kind === SyntaxKind.Identifier) {
                this.write(`'${k.name}'`)
            } else {
                this.writeSyntaxNode(k)
            }
            this.write(' => ')
            this.writeSyntaxNode(v)
            first = false
        }
        this.write(']')
    }

    private writeVariableDefinition (node: VariableDefinition) {
        this.nextLine(`$${node.name}`)
        if (node.initial) {
            this.write(' = ')
            if (node.name === 'ctx' &&
                node.initial.kind === SyntaxKind.MapLiteral) {
                this.write('(object)')
            }
            this.writeSyntaxNode(node.initial)
            this.feedLine(';')
        }
        // 单独处理 data
        if (node.name === 'ctx') {
            this.writeLine('$ctx->data = &$data;')
        }
    }

    private beginNamespace (ns: string = '') {
        const code = ns === ''
            ? 'namespace {'
            : `namespace ${ns} {`

        this.writeLine(code)
        this.indent()
    }

    private endNamespace () {
        this.unindent()
        this.writeLine('}')
    }

    public writeNamespace (ns: string, cb?: Function) {
        if (cb) {
            this.beginNamespace(ns)
            cb()
            this.endNamespace()
        } else {
            this.writeLine(`namespace ${ns};`)
        }
    }

    private writeFunctionDefinition (node: FunctionDefinition | SlotRendererDefinition, use: string[] = []) {
        const nameStr = node.name ? `${node.name} ` : ''
        const useStr = use.length ? `use (${use.join(', ')}) ` : ''
        this.write('function ')
        this.write(nameStr)
        this.write('(')
        let first = true
        for (const arg of node.args) {
            if (!first) this.write(', ')
            this.write(`$${arg.name}`)
            if (arg.initial) {
                this.write(' = ')
                this.writeSyntaxNode(arg.initial)
            }
            first = false
        }
        this.write(') ')
        this.write(useStr)
        this.write('{')
        this.indent()
        for (const stmt of node.body) this.writeSyntaxNode(stmt)
        this.unindent()
        this.nextLine('}')
    }

    private writeExpressionList (list: Expression[]) {
        for (let i = 0; i < list.length; i++) {
            this.writeSyntaxNode(list[i])
            if (i !== list.length - 1) this.write(', ')
        }
    }

    private createComponentInstance (info: ComponentInfo) {
        if (isTypedComponentInfo(info)) {
            const className = info.classDeclaration.getName()
            this.write(`new ${className}()`)
        } else {
            this.write('new SanSSRComponent()')
        }
    }

    private writeBinaryExpression (node: BinaryExpression) {
        switch (node.op) {
        case '.':
            this.writeSyntaxNode(node.lhs)
            this.write('->')
            this.writeSyntaxNode(node.rhs)
            break
        case '[]':
            this.writeSyntaxNode(node.lhs)
            this.write('[')
            this.writeSyntaxNode(node.rhs)
            this.write(']')
            break
        case '+':
            this.writeSyntaxNode(node.lhs)
            if ((node.lhs.kind === SyntaxKind.Literal && typeof node.lhs.value === 'string') ||
                (node.rhs.kind === SyntaxKind.Literal && typeof node.rhs.value === 'string') ||
                (node.lhs.kind === SyntaxKind.HelperCall && node.lhs.name === 'output') ||
                (node.rhs.kind === SyntaxKind.HelperCall && node.rhs.name === 'output') ||
                ['\'', '"'].indexOf(this.lastChar()) > -1) {
                this.write(' . ')
            } else {
                this.write(' + ')
            }
            this.writeSyntaxNode(node.rhs)
            break
        case '+=':
            this.writeSyntaxNode(node.lhs)
            if ((node.lhs.kind === SyntaxKind.Identifier && node.lhs.name === 'html') ||
                (node.rhs.kind === SyntaxKind.Literal && typeof node.rhs.value === 'string')) {
                this.write(' .= ')
            } else {
                this.write(' += ')
            }
            this.writeSyntaxNode(node.rhs)
            break
        case '||':
            this.write('isset(')
            this.writeSyntaxNode(node.lhs)
            this.write(')')
            this.write(' ? ')
            this.writeSyntaxNode(node.lhs)
            this.write(' : ')
            this.writeSyntaxNode(node.rhs)
            break
        case '!=':
            if (node.lhs.kind === SyntaxKind.Null) {
                this.write('isset(')
                this.writeSyntaxNode(node.rhs)
                this.write(')')
            } else {
                this.writeSyntaxNode(node.lhs)
                this.write(` ${node.op} `)
                this.writeSyntaxNode(node.rhs)
            }
            break
        default:
            this.writeSyntaxNode(node.lhs)
            this.write(` ${node.op} `)
            this.writeSyntaxNode(node.rhs)
        }
    }

    private writeUnaryExpression (node: UnaryExpression) {
        if (node.op === '()') {
            this.write('(')
            this.writeSyntaxNode(node.value)
            this.write(')')
        } else {
            this.write(node.op)
            this.writeSyntaxNode(node.value)
        }
    }

    private writeArrayLiteral (node: ArrayLiteral) {
        let first = true
        let useSpread = false
        let needSpread = ''
        for (const [, spread] of node.items) {
            if (spread) {
                useSpread = true
                needSpread += '1'
            } else {
                needSpread += '0'
            }
        }
        let start = '['
        let end = ']'
        if (useSpread) {
            start = '_::spread(' + start
            end += `, '${needSpread}')`
        }
        this.write(start)
        for (const [item] of node.items) {
            if (!first) this.write(', ')
            this.writeSyntaxNode(item)
            first = false
        }
        this.write(end)
    }

    private writeBlockStatements (body: Iterable<Statement>) {
        this.feedLine('{')
        this.indent()
        for (const stmt of body) this.writeSyntaxNode(stmt)
        this.unindent()
        this.writeLine('}')
    }

    private writeForeachStatement (node: Foreach) {
        this.nextLine('if (is_array(')
        this.writeSyntaxNode(node.iterable)
        this.write(') || is_object(')
        this.writeSyntaxNode(node.iterable)
        this.write(')) {')
        this.indent()
        this.nextLine('foreach (')
        this.writeSyntaxNode(node.iterable)
        this.write(' as ')
        this.writeSyntaxNode(node.key)
        this.write(' => ')
        this.writeSyntaxNode(node.value)
        this.write(') ')
        this.writeBlockStatements(node.body)
        this.unindent()
        this.writeLine('}')
    }
}

function isTypedComponentInfo (info: any): info is TypedComponentInfo {
    return typeof info.classDeclaration !== 'undefined'
}
