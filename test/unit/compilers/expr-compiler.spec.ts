import { compileExprSource } from '../../../src/compilers/expr-compiler'

describe('compileExprSource', function () {
    it('string literalize', function () {
        const str = 'bar\x5Cfoo\n\t\r"foo"'
        const ret = compileExprSource.stringLiteralize(str)
        expect(ret).toContain('\\\\')
        expect(ret).toContain('\\"')
        expect(ret).toContain('\\n')
        expect(ret).toContain('\\t')
        expect(ret).toContain('\\r')
    })

    it('expression type = 1 should return string', function () {
        const expr = {
            type: 1,
            literal: 'literal'
        }
        const expr2 = {
            type: 1,
            value: 'value'
        }
        expect(compileExprSource._expr(expr)).toEqual('"literal"')
        expect(compileExprSource._expr(expr2)).toEqual('"value"')
    })
    it('expression type = 2 should return number', function () {
        const expr = {
            type: 2,
            value: 1
        }

        expect(compileExprSource._expr(expr)).toEqual(1)
    })
    it('expression type = 3 should return boolean string', function () {
        const expr = {
            type: 3,
            value: true
        }
        const expr2 = {
            type: 3,
            value: false
        }

        expect(compileExprSource._expr(expr)).toEqual('true')
        expect(compileExprSource._expr(expr2)).toEqual('false')
    })
    it('expression type = 4 should return data access', function () {
        const expr = {
            type: 4,
            paths: [{
                type: 1,
                value: 'ext'
            },
            {
                type: 2,
                value: 1
            },
            {
                type: 3,
                value: true
            },
            {
                type: 4,
                paths: [{ type: 2, value: 10 }]
            }]
        }

        expect(compileExprSource._expr(expr)).toEqual('_::data($ctx, ["ext", 1, _::data($ctx, [10])])')
    })
    it('expression type = 5 should return interp expression', function () {
        const expr = {
            'type': 5,
            'expr': { 'type': 1, 'value': 'erik' },
            'filters': [
                { 'type': 6, 'name': { 'type': 4, 'paths': [{ 'type': 1, 'value': '_class' }] }, 'args': [] }
            ]
        }
        const expr2 = {
            'type': 5,
            'expr': { 'type': 1, 'value': 'erik' },
            'filters': [
                { 'type': 6, 'name': { 'type': 4, 'paths': [{ 'type': 1, 'value': '_style' }] }, 'args': [] }
            ]
        }
        const expr3 = {
            'type': 5,
            'expr': { 'type': 1, 'value': 'erik' },
            'filters': [
                { 'type': 6, 'name': { 'type': 4, 'paths': [{ 'type': 1, 'value': '_xclass' }] }, 'args': [{ 'type': 1, 'value': '' }] }
            ]
        }
        const expr4 = {
            'type': 5,
            'expr': { 'type': 1, 'value': 'erik' },
            'filters': [
                { 'type': 6, 'name': { 'type': 4, 'paths': [{ 'type': 1, 'value': '_xstyle' }] }, 'args': [{ 'type': 1, 'value': '' }] }
            ]
        }
        const expr5 = {
            'type': 5,
            'expr': { 'type': 1, 'value': 'erik' },
            'filters': [
                { 'type': 6, 'name': { 'type': 4, 'paths': [{ 'type': 1, 'value': 'url' }] }, 'args': [{ 'type': 1, 'value': '' }] }
            ]
        }
        const expr6 = {
            'type': 5,
            'expr': { 'type': 1, 'value': 'erik' },
            'filters': [
                { 'type': 6, 'name': { 'type': 4, 'paths': [{ 'type': 1, 'value': 'less' }] }, 'args': [{ 'type': 1, 'value': 'val' }] }
            ]
        }
        const expr7 = {
            'type': 5,
            'original': true,
            'expr': { 'type': 1, 'value': 'erik' },
            'filters': [
                { 'type': 6, 'name': { 'type': 4, 'paths': [{ 'type': 1, 'value': 'xx' }] }, 'args': [] }
            ]
        }
        expect(compileExprSource._expr(expr)).toContain('_::_classFilter("erik")')
        expect(compileExprSource._expr(expr2)).toContain('_::_styleFilter("erik")')
        expect(compileExprSource._expr(expr4)).toContain('_::_xstyleFilter("erik", "")')
        expect(compileExprSource._expr(expr3)).toContain('_::_xclassFilter("erik", "")')
        expect(compileExprSource._expr(expr5)).toContain('encodeURIComponent')
        expect(compileExprSource._expr(expr6)).toContain('_::callFilter($ctx, "less", ["erik", "val"])')
        expect(compileExprSource._expr(expr7)).not.toContain('_::escapeHTML')
    })
    it('expression type = 6 should return call expression', function () {
        const expr = {
            'type': 6,
            'name': {
                'type': 4,
                'paths': [
                    { 'type': 1, 'value': 'op' },
                    { 'type': 1, 'value': 'op' },
                    { 'type': 2, 'value': 2 },
                    { 'type': 3, 'value': true }
                ]
            },
            'args': [{ 'type': 1, 'value': 'num1' }, { 'type': 1, 'value': 'num2' }]
        }
        expect(compileExprSource._expr(expr)).toContain('$ctx->instance->op.op[2][true]("num1","num2")')
    })
    it('expression type = 7 should return text', function () {
        const expr1 = {
            'type': 7,
            'segs': []
        }
        const expr = {
            'type': 7,
            'segs': [
                { 'type': 1, 'value': '1 + 2' },
                { 'type': 1, 'value': '2 * 4' }
            ]
        }
        expect(compileExprSource._expr(expr)).toContain('("1 + 2") . ("2 * 4")')
        expect(compileExprSource._expr(expr1)).toContain('""')
    })
    it('expression type = 8 should return binary operater', function () {
        const expr = {
            'type': 8,
            'operator': 155,
            'segs': [
                { 'type': 2, 'value': 10 },
                { 'type': 2, 'value': 12 }
            ]
        }
        expect(compileExprSource._expr(expr)).toEqual('10!==12')
    })
    it('expression type = 9 should return binary expression', function () {
        const expr = {
            'type': 9,
            'operator': 33,
            'expr': { 'type': 2, 'value': 10 }
        }
        const expr2 = {
            'type': 9,
            'operator': 45,
            'expr': { 'type': 2, 'value': 10 }
        }
        const expr3 = {
            'type': 9,
            'operator': 145,
            'expr': { 'type': 2, 'value': 10 }
        }
        expect(compileExprSource._expr(expr)).toEqual('!10')
        expect(compileExprSource._expr(expr2)).toEqual('-10')
        expect(compileExprSource._expr(expr3)).toEqual('')
    })
    it('expression type = 10 should return ternary expression', function () {
        const expr = {
            'type': 10,
            'segs': [
                { 'type': 3, 'value': true },
                { 'type': 2, 'value': 10 },
                { 'type': 2, 'value': 12 }
            ]
        }
        expect(compileExprSource._expr(expr)).toEqual('true?10:12')
    })
    it('expression type = 11 should return object', function () {
        const expr = {
            'type': 11,
            'items': [
                { 'expr': { 'type': 2, 'value': 1 }, 'name': { 'type': 1, 'value': 'key' } },
                { 'spread': true, 'expr': { 'type': 1, 'value': 'erik' } }
            ]
        }

        expect(compileExprSource._expr(expr)).toEqual('_::objSpread([["key", 1],"erik"], [0,1])')
    })
    it('expression type = 12 should return array', function () {
        const expr = {
            'type': 12,
            'items': [
                { 'expr': { 'type': 2, 'value': 1 } },
                { 'spread': true, 'expr': { 'type': 1, 'value': 'erik' } }
            ]
        }

        expect(compileExprSource._expr(expr)).toEqual('_::spread([1, "erik"], [0,1])')
    })
    it('expression type = 13 should return null', function () {
        const expr = {
            'type': 13
        }
        expect(compileExprSource._expr(expr)).toEqual('null')
    })
    it('expression with parenthesized = true should return with ()', function () {
        const expr = {
            'type': 1,
            'value': 'bar',
            'parenthesized': true
        }
        expect(compileExprSource.expr(expr)).toEqual('("bar")')
    })
    it('data access with default arguments', function () {
        expect(compileExprSource.dataAccess()).toEqual('_::data($ctx, [])')
    })
})
