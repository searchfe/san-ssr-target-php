import { Stringifier } from '../../../src/emitters/stringifier'

describe('Stringifier', function () {
    let stringifier

    beforeEach(function () {
        stringifier = new Stringifier('\\san')
    })

    it('should stringify string', function () {
        const str = stringifier.any(`'foo'`)

        expect(str).toEqual(`'\\'foo\\''`)
    })

    describe('.str()', () => {
        it('should escape slash', function () {
            expect(stringifier.str('\\')).toEqual(`'\\\\'`)
        })
        it('should escape carriage return', function () {
            expect(stringifier.str('\r')).toEqual(`'\\r'`)
        })
        it('should escape tab', function () {
            expect(stringifier.str('\t')).toEqual(`'\\t'`)
        })
        it('should escape line feed', function () {
            expect(stringifier.str('\n')).toEqual(`'\\n'`)
        })
        it('should escape quote', function () {
            expect(stringifier.str(`'foo'"bar"`)).toEqual(`'\\'foo\\'"bar"'`)
        })
        it('should escape double quote', function () {
            expect(stringifier.str(`'foo'"bar"`, '"')).toEqual(`"'foo'\\"bar\\""`)
        })
        it('should not escape dollar in single quote', function () {
            expect(stringifier.str('$foo')).toEqual(`'$foo'`)
        })
        it('should escape dollar in double quote', function () {
            expect(stringifier.str('$foo', '"')).toEqual(`"\\$foo"`)
        })
    })

    it('should stringify number', function () {
        expect(stringifier.any(12)).toEqual('12')
        expect(stringifier.any(NaN)).toEqual('null')
    })

    it('should stringify boolean', function () {
        const bool = stringifier.any(true)
        const bool2 = stringifier.any(false)

        expect(bool).toEqual('true')
        expect(bool2).toEqual('false')
    })

    it('should return null', function () {
        expect(stringifier.any(null)).toEqual('null')
    })

    it('should stringify object', function () {
        const obj = {
            a: 1,
            b: 2
        }
        const ret = stringifier.any(obj)
        expect(ret).toEqual(`['a' => 1,'b' => 2]`)
    })

    it('should stringify object and skip undefined value', function () {
        const obj = {
            a: 1,
            b: 2,
            c: undefined
        }

        const ret = stringifier.any(obj)
        expect(ret).toEqual(`['a' => 1,'b' => 2]`)
    })

    it('should stringify array', function () {
        const arr = ['1', '2']
        const ret = stringifier.any(arr)

        expect(ret).toEqual(`['1','2']`)
    })

    it('should stringify date with Ts2Php_Date function', function () {
        const date = new Date()
        const ret = stringifier.any(date)

        expect(ret).toContain('new \\san\\Ts2Php_Date')
    })

    it('should throw error', function () {
        expect(() => {
            stringifier.any()
        }).toThrow()
    })
})
