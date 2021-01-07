import { SyntaxKind } from 'san-ssr'
import { PHPEmitter } from '../../../src/emitters/emitter'

describe('PHPEmitter', function () {
    let emitter

    beforeEach(function () {
        emitter = new PHPEmitter()
    })

    describe('write namespace', function () {
        it('should write namespace with ns', function () {
            emitter.writeNamespace('san', function () {
                emitter.writeLine('bar')
            })

            expect(emitter.fullText()).toEqual('namespace san {\n    bar\n}\n')
        })
        it('should write namespace without ns', function () {
            emitter.beginNamespace()
            emitter.endNamespace()

            expect(emitter.fullText()).toEqual('namespace {\n}\n')
        })
    })

    describe('switch node kind', function () {
        it('should throw if kind not supported', () => {
            expect(() => emitter.writeSyntaxNode({ kind: 88888 } as any)).toThrow(/not supported/)
        })
    })

    describe('write function definition', function () {
        it('should write anonymous function', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.FunctionDefinition,
                name: '',
                args: [],
                body: []
            })

            expect(emitter.fullText()).toEqual('function () {\n}')
        })

        it('should write function with args with initial', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.FunctionDefinition,
                name: 'foo',
                args: [
                    {
                        name: 'a'
                    }, {
                        name: 'b',
                        initial: {
                            kind: SyntaxKind.Literal,
                            value: '1'
                        }
                    }
                ],
                body: []
            })

            expect(emitter.fullText()).toEqual('function foo ($a, $b = "1") {\n}')
        })

        it('should write function use (&$ctx)', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.SlotRendererDefinition,
                name: '',
                args: [],
                body: []
            })

            expect(emitter.fullText()).toEqual('function () use (&$ctx) {\n}')
        })
    })

    describe('write identifier', function () {
        it('should write prefix $', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.Identifier,
                name: 'a'
            })

            expect(emitter.fullText()).toEqual('$a')
        })

        it('should write name only when last char is >', function () {
            emitter.write('>')
            emitter.writeSyntaxNode({
                kind: SyntaxKind.Identifier,
                name: 'a'
            })

            expect(emitter.fullText()).toEqual('>a')
        })
    })

    describe('write array includes', function () {
        it('should write _::contains', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.ArrayIncludes,
                arr: {
                    kind: SyntaxKind.Identifier,
                    name: 'foo'
                },
                item: {
                    kind: SyntaxKind.Literal,
                    value: 'bar'
                }
            })

            expect(emitter.fullText()).toEqual('_::contains($foo, "bar")')
        })
    })

    describe('write map assign', function () {
        it('should write _::extend', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.MapAssign,
                dest: {
                    kind: SyntaxKind.Identifier,
                    name: 'foo'
                },
                srcs: [
                    {
                        kind: SyntaxKind.Identifier,
                        name: 'bar'
                    }
                ]
            })

            expect(emitter.fullText()).toEqual('_::extend($foo, $bar)')
        })
    })

    describe('write regexp replace', function () {
        it('should write _::preg_replace', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.RegexpReplace,
                pattern: 'foo',
                replacement: {
                    kind: SyntaxKind.Literal,
                    value: 'bar'
                },
                original: {
                    kind: SyntaxKind.Literal,
                    value: 'foooo'
                }
            })

            expect(emitter.fullText()).toEqual('preg_replace(\'/foo/\', "bar", "foooo")')
        })
    })

    describe('write json stringify', function () {
        it('should write _::json_encode', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.JSONStringify,
                value: {
                    kind: SyntaxKind.Identifier,
                    name: 'foo'
                }
            })

            expect(emitter.fullText()).toEqual('_::json_encode($foo)')
        })
    })

    describe('write binary expression', function () {
        it('should write original op', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.BinaryExpression,
                op: '-',
                lhs: {
                    kind: SyntaxKind.Identifier,
                    name: 'foo'
                },
                rhs: {
                    kind: SyntaxKind.Identifier,
                    name: 'bar'
                }
            })

            expect(emitter.fullText()).toEqual('$foo - $bar')
        })

        it('should write ->', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.BinaryExpression,
                op: '.',
                lhs: {
                    kind: SyntaxKind.Identifier,
                    name: 'foo'
                },
                rhs: {
                    kind: SyntaxKind.Identifier,
                    name: 'bar'
                }
            })

            expect(emitter.fullText()).toEqual('$foo->bar')
        })

        it('should write []', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.BinaryExpression,
                op: '[]',
                lhs: {
                    kind: SyntaxKind.Identifier,
                    name: 'foo'
                },
                rhs: {
                    kind: SyntaxKind.Literal,
                    value: 'bar'
                }
            })

            expect(emitter.fullText()).toEqual('$foo["bar"]')
        })

        it('should write . when lhs is string', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.BinaryExpression,
                op: '+',
                lhs: {
                    kind: SyntaxKind.Literal,
                    value: 'foo'
                },
                rhs: {
                    kind: SyntaxKind.Identifier,
                    name: 'bar'
                }
            })

            expect(emitter.fullText()).toEqual('"foo" . $bar')
        })

        it('should write . when lhs is output helper', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.BinaryExpression,
                op: '+',
                lhs: {
                    kind: SyntaxKind.HelperCall,
                    name: 'output',
                    args: []
                },
                rhs: {
                    kind: SyntaxKind.Identifier,
                    name: 'bar'
                }
            })

            expect(emitter.fullText()).toEqual('_::output() . $bar')
        })

        it('should write . when rhs is string', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.BinaryExpression,
                op: '+',
                lhs: {
                    kind: SyntaxKind.Identifier,
                    name: 'foo'
                },
                rhs: {
                    kind: SyntaxKind.Literal,
                    value: 'bar'
                }
            })

            expect(emitter.fullText()).toEqual('$foo . "bar"')
        })

        it('should write . when rhs is output helper', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.BinaryExpression,
                op: '+',
                lhs: {
                    kind: SyntaxKind.Identifier,
                    name: 'foo'
                },
                rhs: {
                    kind: SyntaxKind.HelperCall,
                    name: 'output',
                    args: []
                }
            })

            expect(emitter.fullText()).toEqual('$foo . _::output()')
        })

        it('should write +', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.BinaryExpression,
                op: '+',
                lhs: {
                    kind: SyntaxKind.Identifier,
                    name: 'foo'
                },
                rhs: {
                    kind: SyntaxKind.Identifier,
                    name: 'bar'
                }
            })

            expect(emitter.fullText()).toEqual('$foo + $bar')
        })

        it('should write .=', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.BinaryExpression,
                op: '+=',
                lhs: {
                    kind: SyntaxKind.Identifier,
                    name: 'html'
                },
                rhs: {
                    kind: SyntaxKind.Literal,
                    value: '</div>'
                }
            })

            expect(emitter.fullText()).toEqual('$html .= "</div>"')
        })

        it('should write +=', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.BinaryExpression,
                op: '+=',
                lhs: {
                    kind: SyntaxKind.Identifier,
                    name: 'count'
                },
                rhs: {
                    kind: SyntaxKind.Literal,
                    value: 1
                }
            })

            expect(emitter.fullText()).toEqual('$count += 1')
        })

        it('should write tenary operator', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.BinaryExpression,
                op: '||',
                lhs: {
                    kind: SyntaxKind.Identifier,
                    name: 'foo'
                },
                rhs: {
                    kind: SyntaxKind.Identifier,
                    name: 'bar'
                }
            })

            expect(emitter.fullText()).toEqual('isset($foo) ? $foo : $bar')
        })

        it('should write isset', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.BinaryExpression,
                op: '!=',
                lhs: {
                    kind: SyntaxKind.Null
                },
                rhs: {
                    kind: SyntaxKind.Identifier,
                    name: 'foo'
                }
            })

            expect(emitter.fullText()).toEqual('isset($foo)')
        })

        it('should write !=', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.BinaryExpression,
                op: '!=',
                lhs: {
                    kind: SyntaxKind.Identifier,
                    name: 'foo'
                },
                rhs: {
                    kind: SyntaxKind.Identifier,
                    name: 'bar'
                }
            })

            expect(emitter.fullText()).toEqual('$foo != $bar')
        })
    })

    describe('write conditional expression', function () {
        it('should write tenary operator', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.ConditionalExpression,
                cond: {
                    kind: SyntaxKind.Identifier,
                    name: 'foo'
                },
                trueValue: {
                    kind: SyntaxKind.Identifier,
                    name: 'foo'
                },
                falseValue: {
                    kind: SyntaxKind.Identifier,
                    name: 'bar'
                }
            })

            expect(emitter.fullText()).toEqual('$foo ? $foo : $bar')
        })
    })

    describe('write encode uri', function () {
        it('should write encodeURIComponent', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.EncodeURIComponent,
                value: {
                    kind: SyntaxKind.Literal,
                    value: 'foo'
                }
            })

            expect(emitter.fullText()).toEqual('encodeURIComponent("foo")')
        })
    })

    describe('write computed call', function () {
        it('should write computed call', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.ComputedCall,
                name: 'sum'
            })

            expect(emitter.fullText()).toEqual('$instance->data->get("sum")')
        })
    })

    describe('write filter call', function () {
        it('should write filter call', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.FilterCall,
                name: 'sum',
                args: []
            })

            expect(emitter.fullText()).toEqual('_::callFilter($ctx, "sum", [])')
        })
    })

    describe('write getRootContext', function () {
        it('should write _::getRootContext', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.GetRootCtxCall,
                args: []
            })

            expect(emitter.fullText()).toEqual('_::getRootContext()')
        })
    })

    describe('write helper call', function () {
        it('should write _::getRootContext', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.HelperCall,
                name: 'getRootContext',
                args: []
            })

            expect(emitter.fullText()).toEqual('_::getRootContext()')
        })
    })

    describe('write function call', function () {
        it('should write call_user_func', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.FunctionCall,
                fn: {
                    kind: SyntaxKind.ComponentRendererReference,
                    value: {
                        kind: SyntaxKind.Literal,
                        value: 'foo'
                    }
                },
                args: [
                    {
                        kind: SyntaxKind.Literal,
                        value: 'bar'
                    }
                ]
            })

            expect(emitter.fullText()).toEqual('call_user_func("foo", "bar")')
        })

        it('should write simple function call', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.FunctionCall,
                fn: {
                    kind: SyntaxKind.Identifier,
                    name: 'foo'
                },
                args: [
                    {
                        kind: SyntaxKind.Literal,
                        value: 'bar'
                    }
                ]
            })

            expect(emitter.fullText()).toEqual('$foo("bar")')
        })
    })

    describe('write create component instance', function () {
        it('should write new SanSSRComponent', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.CreateComponentInstance,
                info: {}
            })

            expect(emitter.fullText()).toEqual('new SanSSRComponent()')
        })

        it('should write class name', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.CreateComponentInstance,
                info: {
                    classDeclaration: {
                        getName: () => 'CustomComponent'
                    }
                }
            })

            expect(emitter.fullText()).toEqual('new CustomComponent()')
        })
    })

    describe('write new expression', function () {
        it('should write new Foo', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.NewExpression,
                name: {
                    kind: SyntaxKind.Identifier,
                    name: 'Foo'
                },
                args: []
            })

            expect(emitter.fullText()).toEqual('new Foo()')
        })

        it('should write new $instance->MyComponent', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.NewExpression,
                name: {
                    kind: SyntaxKind.BinaryExpression,
                    op: '.',
                    lhs: {
                        kind: SyntaxKind.Identifier,
                        name: 'instance'
                    },
                    rhs: {
                        kind: SyntaxKind.Identifier,
                        name: 'MyComponent'
                    }
                },
                args: []
            })

            expect(emitter.fullText()).toEqual('new $instance->MyComponent()')
        })
    })

    describe('write unary expression', function () {
        it('should write ()', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.UnaryExpression,
                op: '()',
                value: {
                    kind: SyntaxKind.Identifier,
                    name: 'foo'
                }
            })

            expect(emitter.fullText()).toEqual('($foo)')
        })

        it('should write original operator', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.UnaryExpression,
                op: '!',
                value: {
                    kind: SyntaxKind.Identifier,
                    name: 'foo'
                }
            })

            expect(emitter.fullText()).toEqual('!$foo')
        })
    })

    describe('write array literal', function () {
        it('should spread', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.ArrayLiteral,
                items: [
                    [{
                        kind: SyntaxKind.Identifier,
                        name: 'foo'
                    }, false],
                    [{
                        kind: SyntaxKind.Identifier,
                        name: 'bar'
                    }, true]
                ]
            })

            expect(emitter.fullText()).toEqual('_::spread([$foo, $bar], \'01\')')
        })

        it('should write array', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.ArrayLiteral,
                items: [
                    [{
                        kind: SyntaxKind.Literal,
                        value: 'foo'
                    }, false],
                    [{
                        kind: SyntaxKind.Literal,
                        value: 'bar'
                    }, false]
                ]
            })

            expect(emitter.fullText()).toEqual('["foo", "bar"]')
        })
    })

    describe('write map literal', function () {
        it('should write _::objSpread', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.MapLiteral,
                items: [
                    [{
                        kind: SyntaxKind.Identifier,
                        name: 'foo'
                    }, {
                        kind: SyntaxKind.Literal,
                        value: 'foo'
                    }, false],
                    [{
                        kind: SyntaxKind.Identifier,
                        name: 'bar'
                    }, {
                        kind: SyntaxKind.Identifier,
                        name: 'bar'
                    }, true]
                ]
            })

            expect(emitter.fullText()).toEqual('_::objSpread([[$foo, "foo"], $bar], "01")')
        })

        it('should write map', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.MapLiteral,
                items: [
                    [{
                        kind: SyntaxKind.Identifier,
                        name: 'foo'
                    }, {
                        kind: SyntaxKind.Literal,
                        value: 'foo'
                    }, false],
                    [{
                        kind: SyntaxKind.Literal,
                        value: 'bar'
                    }, {
                        kind: SyntaxKind.Identifier,
                        name: 'bar'
                    }, false]
                ]
            })

            expect(emitter.fullText()).toEqual('[\'foo\' => "foo", "bar" => $bar]')
        })
    })

    describe('write component reference literal', function () {
        it('should throw error if referenceCompiler is null', function () {
            expect(() => emitter.writeSyntaxNode({ kind: SyntaxKind.ComponentReferenceLiteral })).toThrow('referenceCompiler is required')
        })

        it('should write function full name', function () {
            const mockReferenceCompiler = {
                compileToFunctionFullName: () => 'foo'
            }
            emitter.setReferenceCompiler(mockReferenceCompiler)
            emitter.writeSyntaxNode({
                kind: SyntaxKind.ComponentReferenceLiteral,
                value: 'foo',
                args: [],
                body: []
            })

            expect(emitter.fullText()).toEqual('\'foo\'')
        })
    })

    describe('write return', function () {
        it('should write return', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.ReturnStatement,
                value: {
                    kind: SyntaxKind.Literal,
                    value: 0
                }
            })

            expect(emitter.fullText()).toEqual('return 0;\n')
        })
    })

    describe('write expression', function () {
        it('should write expression', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.ExpressionStatement,
                value: {
                    kind: SyntaxKind.GetRootCtxCall,
                    args: []
                }
            })

            expect(emitter.fullText()).toEqual('_::getRootContext();\n')
        })
    })

    describe('write import helper', function () {
        it('should not emit import helper', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.ImportHelper
            })

            expect(emitter.fullText()).toEqual('')
        })
    })

    describe('write assignment', function () {
        it('should write assignment', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.AssignmentStatement,
                lhs: {
                    kind: SyntaxKind.Identifier,
                    name: 'foo'
                },
                rhs: {
                    kind: SyntaxKind.Literal,
                    value: 'foo'
                }
            })

            expect(emitter.fullText()).toEqual('$foo = "foo";\n')
        })
    })

    describe('write variable definition', function () {
        it('should write variable definition without initial', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.VariableDefinition,
                name: 'foo'
            })

            expect(emitter.fullText()).toEqual('$foo')
        })

        it('should write variable definition with initial', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.VariableDefinition,
                name: 'foo',
                initial: {
                    kind: SyntaxKind.Literal,
                    value: 'foo'
                }
            })

            expect(emitter.fullText()).toEqual('$foo = "foo";\n')
        })

        it('should write (object)[]', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.VariableDefinition,
                name: 'ctx',
                initial: {
                    kind: SyntaxKind.MapLiteral,
                    items: []
                }
            })

            expect(emitter.fullText()).toEqual('$ctx = (object)[];\n$ctx->data = &$data;\n')
        })
    })

    describe('write if', function () {
        it('should write if', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.If,
                cond: {
                    kind: SyntaxKind.Identifier,
                    name: 'foo'
                },
                body: []
            })

            expect(emitter.fullText()).toEqual('if ($foo) {\n}\n')
        })
    })

    describe('write else if', function () {
        it('should write else if', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.ElseIf,
                cond: {
                    kind: SyntaxKind.Identifier,
                    name: 'foo'
                },
                body: []
            })

            expect(emitter.fullText()).toEqual('else if ($foo) {\n}\n')
        })
    })

    describe('write else', function () {
        it('should write else', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.Else,
                body: []
            })

            expect(emitter.fullText()).toEqual('else {\n}\n')
        })
    })

    describe('write foreach', function () {
        it('should write foreach', function () {
            emitter.writeSyntaxNode({
                kind: SyntaxKind.Foreach,
                iterable: {
                    kind: SyntaxKind.Identifier,
                    name: 'items'
                },
                key: {
                    kind: SyntaxKind.Identifier,
                    name: 'index'
                },
                value: {
                    kind: SyntaxKind.Identifier,
                    name: 'item'
                },
                body: []
            })

            expect(emitter.fullText()).toEqual('if (is_array($items) || is_object($items)) {\n    foreach ($items as $index => $item) {\n    }\n}\n')
        })
    })
})
