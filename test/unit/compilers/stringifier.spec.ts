import { Stringifier } from '../../../src/compilers/stringifier'

describe('Stringifier', function () {
    let stringifier

    beforeEach(function () {
        stringifier = new Stringifier('san')
    })

    it('should stringify string', function () {
        const str = stringifier.any('"foo"')

        expect(str).toEqual('"\\"foo\\""')
    })

    it('should stringify number', function () {
        const num = stringifier.any(12)

        expect(typeof num).toEqual('string')
    })

    it('should stringify boolean', function () {
        const bool = stringifier.any(true)
        const bool2 = stringifier.any(false)

        expect(bool).toEqual('true')
        expect(bool2).toEqual('false')
    })

    it('should return null', function () {
        expect(stringifier.any(null)).toBeNull()
    })

    it('should stringify object', function () {
        const obj = {
            a: 1,
            b: 2
        }
        const ret = stringifier.any(obj)
        expect(ret).toEqual('(object)["a" => 1,"b" => 2]')
    })

    it('should stringify object and skip undefined value', function () {
        const obj = {
            a: 1,
            b: 2,
            c: undefined
        }

        const ret = stringifier.any(obj)
        expect(ret).toEqual('(object)["a" => 1,"b" => 2]')
    })

    it('should stringify array', function () {
        const arr = ['1', '2']
        const ret = stringifier.any(arr)

        expect(ret).toEqual('["1","2"]')
    })

    it('should stringify date with Ts2Php_Date function', function () {
        const date = new Date()
        const ret = stringifier.any(date)

        expect(ret).toContain('new \\sanruntime\\Ts2Php_Date')
    })

    it('should throw error', function () {
        expect(() => {
            stringifier.any()
        }).toThrow()
    })
})
