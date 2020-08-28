import { parseExpr } from 'san'
import { ExprCompiler } from '../../../src/compilers/expr-compiler'
import { Stringifier } from '../../../src/compilers/stringifier'

describe('ExprCompiler', function () {
    const expr = new ExprCompiler(new Stringifier(''))
    describe('#compile()', () => {
        it('expression type = 1 should return string', function () {
            const expr1 = {
                type: 1,
                value: 'value'
            }
            expect(expr.compile(expr1 as any)).toEqual('"value"')
        })
        it('expression type = 2 should return number', function () {
            const e = {
                type: 2,
                value: 1
            }

            expect(expr.compile(e as any)).toEqual('1')
        })
        it('expression type = 3 should return boolean string', function () {
            const expr1 = {
                type: 3,
                value: true
            }
            const expr2 = {
                type: 3,
                value: false
            }

            expect(expr.compile(expr1 as any)).toEqual('true')
            expect(expr.compile(expr2 as any)).toEqual('false')
        })
        it('expression type = 4 should return data access', function () {
            const e = {
                type: 4,
                paths: [{
                    type: 1,
                    value: 'ext'
                }, {
                    type: 2,
                    value: 1
                }, {
                    type: 3,
                    value: true
                }, {
                    type: 4,
                    paths: [{ type: 2, value: 10 }]
                }]
            }

            expect(expr.compile(e as any)).toEqual('$ctx->data["ext"][1][true][$ctx->data[10]]')
        })
        it('expression type = 5 should return interp expression', function () {
            const expr1 = {
                type: 5,
                expr: { type: 1, value: 'erik' },
                filters: [
                    { type: 6, name: { type: 4, paths: [{ type: 1, value: '_class' }] }, args: [] }
                ]
            }
            const expr2 = {
                type: 5,
                expr: { type: 1, value: 'erik' },
                filters: [
                    { type: 6, name: { type: 4, paths: [{ type: 1, value: '_style' }] }, args: [] }
                ]
            }
            const expr3 = {
                type: 5,
                expr: { type: 1, value: 'erik' },
                filters: [
                    { type: 6, name: { type: 4, paths: [{ type: 1, value: '_xclass' }] }, args: [{ type: 1, value: '' }] }
                ]
            }
            const expr4 = {
                type: 5,
                expr: { type: 1, value: 'erik' },
                filters: [
                    { type: 6, name: { type: 4, paths: [{ type: 1, value: '_xstyle' }] }, args: [{ type: 1, value: '' }] }
                ]
            }
            const expr5 = {
                type: 5,
                expr: { type: 1, value: 'erik' },
                filters: [
                    { type: 6, name: { type: 4, paths: [{ type: 1, value: 'url' }] }, args: [{ type: 1, value: '' }] }
                ]
            }
            const expr6 = {
                type: 5,
                expr: { type: 1, value: 'erik' },
                filters: [
                    { type: 6, name: { type: 4, paths: [{ type: 1, value: 'less' }] }, args: [{ type: 1, value: 'val' }] }
                ]
            }
            const expr7 = {
                type: 5,
                original: true,
                expr: { type: 1, value: 'erik' },
                filters: [
                    { type: 6, name: { type: 4, paths: [{ type: 1, value: 'xx' }] }, args: [] }
                ]
            }
            expect(expr.compile(expr1 as any)).toContain('_::_classFilter("erik")')
            expect(expr.compile(expr2 as any)).toContain('_::_styleFilter("erik")')
            expect(expr.compile(expr4 as any)).toContain('_::_xstyleFilter("erik", "")')
            expect(expr.compile(expr3 as any)).toContain('_::_xclassFilter("erik", "")')
            expect(expr.compile(expr5 as any)).toContain('encodeURIComponent')
            expect(expr.compile(expr6 as any)).toContain('_::callFilter($ctx, "less", ["erik", "val"])')
            expect(expr.compile(expr7 as any)).not.toContain('_::escapeHTML')
        })
        it('expression type = 6 should return call expression', function () {
            const e = {
                type: 6,
                name: {
                    type: 4,
                    paths: [
                        { type: 1, value: 'op' },
                        { type: 1, value: 'op' },
                        { type: 2, value: 2 },
                        { type: 3, value: true }
                    ]
                },
                args: [{ type: 1, value: 'num1' }, { type: 1, value: 'num2' }]
            }
            expect(expr.compile(e as any)).toContain('$ctx->instance->op.op[2][true]("num1", "num2")')
        })
        it('expression type = 7 should return text', function () {
            const expr1 = {
                type: 7,
                segs: [
                    { type: 1, value: 'a' },
                    { type: 1, value: 'b' }
                ]
            }
            const expr2 = {
                type: 7,
                segs: []
            }
            expect(expr.compile(expr1 as any)).toContain('"a" . "b"')
            expect(expr.compile(expr2 as any)).toContain('""')
        })
        it('expression type = 8 should return binary operater', function () {
            const e = {
                type: 8,
                operator: 155,
                segs: [
                    { type: 2, value: 10 },
                    { type: 2, value: 12 }
                ]
            }
            expect(expr.compile(e as any)).toEqual('10 !== 12')
        })
        it('expression type = 9 should return binary expression', function () {
            const expr1 = {
                type: 9,
                operator: 33,
                expr: { type: 2, value: 10 }
            }
            const expr2 = {
                type: 9,
                operator: 45,
                expr: { type: 2, value: 10 }
            }
            expect(expr.compile(expr1 as any)).toEqual('!10')
            expect(expr.compile(expr2 as any)).toEqual('-10')
        })
        it('expression type = 10 should return ternary expression', function () {
            const expr1 = {
                type: 10,
                segs: [
                    { type: 3, value: true },
                    { type: 2, value: 10 },
                    { type: 2, value: 12 }
                ]
            }
            expect(expr.compile(expr1 as any)).toEqual('true?10:12')
        })
        it('expression type = 11 should return object', function () {
            const expr1 = {
                type: 11,
                items: [
                    { expr: { type: 2, value: 1 }, name: { type: 1, value: 'key' } },
                    { spread: true, expr: { type: 1, value: 'erik' } }
                ]
            }

            expect(expr.compile(expr1 as any)).toEqual('_::objSpread([["key", 1], "erik"], \'01\')')
        })
        it('expression type = 12 should return array', function () {
            const expr1 = {
                type: 12,
                items: [
                    { expr: { type: 2, value: 1 } },
                    { spread: true, expr: { type: 1, value: 'erik' } }
                ]
            }

            expect(expr.compile(expr1 as any)).toEqual('_::spread([1, "erik"], \'01\')')
        })
        it('expression type = 13 should return null', function () {
            const expr1 = {
                type: 13
            }
            expect(expr.compile(expr1 as any)).toEqual('null')
        })
        it('expression with parenthesized = true should return with ()', function () {
            const expr1 = {
                type: 1,
                value: 'bar',
                parenthesized: true
            }
            expect(expr.compile(expr1 as any)).toEqual('("bar")')
        })
        it('data access with default arguments', function () {
            expect(expr.dataAccess(undefined, 'none')).toEqual('$ctx->data')
        })
        it('should throw for unexpected expression type', () => {
            const e = parseExpr('!b')
            e.type = 222
            expect(() => expr.compile(e)).toThrow(/unexpected expression/)
        })
        it('should throw for unexpected unary operator', () => {
            const e = parseExpr('!b') as any
            e.operator = '~'.charCodeAt(0)
            expect(() => expr.compile(e)).toThrow('unexpected unary operator "~"')
        })
    })

    describe('.text()', () => {
        it('should compile to empty string for empty text', () => {
            expect(expr.text({ type: 7, segs: [] } as any, 'none')).toEqual('""')
        })
    })
})
