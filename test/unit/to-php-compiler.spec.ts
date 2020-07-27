import { SanProject } from 'san-ssr'
import ToPHPCompiler from '../../src/index'
import { resolve } from 'path'

const fromTestDir = x => resolve(__dirname, '..', x)

const tsConfigFilePath = fromTestDir('tsconfig.json')

const compileComponent = (file: string, options = {}) => {
    const proj = new SanProject(tsConfigFilePath)
    const cc = ToPHPCompiler.fromSanProject(proj)

    const filepath = fromTestDir(file)
    const app = proj.parseSanSourceFile(filepath)

    return cc.compileToSource(app, options)
}

describe('ToPHPCompiler', function () {
    it('should compile a component file', function () {
        const result = compileComponent('stub/a.comp.ts')

        expect(result).toContain('namespace san\\test\\stub\\a_comp {')
        expect(result).toContain('class A extends SanSSRComponent {')
        expect(result).toContain('namespace san\\helpers {')
    })

    it('should compile filters into static methods', function () {
        const result = compileComponent('stub/filters.comp.ts')

        expect(result).toContain('A::$filters = array(')
        expect(result).toContain('A::$filters = array(')
        expect(result).toContain('"add" => function ($x, $y){')
    })

    it('should respect to modules config for ts2php', function () {
        const result1 = compileComponent('stub/b.comp.ts')
        expect(result1).toContain('require_once("lodash")')

        const result2 = compileComponent('stub/b.comp.ts', {
            modules: {
                lodash: {
                    name: 'lodash',
                    required: true
                }
            }
        })
        expect(result2).not.toContain('require_once("lodash")')
    })

    it('should respect to modules config for ts2php', function () {
        const result1 = compileComponent('stub/b.comp.ts')
        expect(result1).toContain('require_once("lodash")')

        const result2 = compileComponent('stub/b.comp.ts', {
            modules: {
                lodash: {
                    name: 'lodash',
                    required: true
                }
            }
        })
        expect(result2).not.toContain('require_once("lodash")')
    })

    it('should not bundle dependency', function () {
        const result = compileComponent('stub/c.comp.ts')
        expect(result).toContain('class C extends SanSSRComponent')
        expect(result).toContain('function render ($data, $noDataOutput')
        expect(result).not.toContain('function sum($a, $b)')
    })

    it('should support emit helpers only', function () {
        const result = ToPHPCompiler.emitHelpers()

        expect(result).toContain('namespace san\\helpers;')
        expect(result).toContain('class Ts2Php_Date')
        expect(result).toContain('class SanSSRData')
    })

    it('should support emit helpers with specified namespace', function () {
        const result = ToPHPCompiler.emitHelpers({ namespace: '\\foo' })
        expect(result).toContain('namespace \\foo;')
    })

    it('should support emit helpers without <?php header', function () {
        const result = ToPHPCompiler.emitHelpers({ emitHeader: false })
        expect(result).toMatch(/^namespace san\\helpers;/)
    })

    it('should throw if tsconfig not specified', function () {
        expect(() => new ToPHPCompiler({} as any)).toThrow('tsconfig.json path is required')
    })
})
