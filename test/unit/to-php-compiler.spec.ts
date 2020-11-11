import { SanProject, CompileInput } from 'san-ssr'
import ToPHPCompiler from '../../src/index'
import { join } from 'path'

const tsConfigFilePath = join(__dirname, '../tsconfig.json')

const compileSourceFile = (input: CompileInput, options = {}) => {
    const proj = new SanProject(tsConfigFilePath)
    const cc = ToPHPCompiler.fromSanProject(proj)
    const app = proj.parseSanSourceFile(input)
    return cc.compileToSource(app, options)
}

describe('ToPHPCompiler', function () {
    it('should compile a component file', function () {
        const result = compileSourceFile({
            filePath: join(__dirname, 'comp/a.comp.ts'),
            fileContent: `
                import { Component } from 'san'

                export default class A extends Component {
                    public static template = 'A'
                }`
        })

        expect(result).toContain('namespace san\\unit\\comp\\a_comp {')
        expect(result).toContain('class A extends SanSSRComponent {')
        expect(result).toContain('namespace san\\helpers {')
    })

    it('should compile filters into static methods', function () {
        const result = compileSourceFile({
            filePath: '/stub/filters.comp.ts',
            fileContent: `
                import { Component } from 'san'

                export default class A extends Component {
                    public static template = 'empty'
                    public static filters = {
                        'add': (x, y) => x + y
                    }
                }`
        })

        expect(result).toContain('A::$filters = array(')
        expect(result).toContain('A::$filters = array(')
        expect(result).toContain('"add" => function ($x, $y){')
    })

    it('should support modules config for ts2php', function () {
        const fileContent = `
            import { Component } from 'san'
            import { defaultTo } from 'lodash'

            export default class B extends Component {
                public static template = 'B'
                someMethod () {
                    console.log(defaultTo(0, 10))
                }
            }
        `
        const result1 = compileSourceFile({
            filePath: '/stub/b.comp.ts',
            fileContent
        })
        expect(result1).toContain('require_once("lodash")')

        const result2 = compileSourceFile({
            filePath: '/stub/b.comp.ts',
            fileContent
        }, {
            modules: {
                lodash: {
                    name: 'lodash',
                    required: true
                }
            }
        })
        expect(result2).not.toContain('require_once("lodash")')
    })

    it('should support getModuleNamespace', function () {
        const result = compileSourceFile({
            filePath: '/stub/external.comp.ts',
            fileContent: `
                import { Component } from 'san'
                import { XList } from '@cases/multi-component-files/list'
                import { square } from '@cases/multi-files/square'

                export default class MyComponent extends Component {
                    static components = {
                        'x-l': XList
                    }
                    static filters = {
                        square: function (arr) {
                            return arr.map(num => square(num))
                        }
                    }
                    initData () {
                        return {
                            list: [1, 2, 3]
                        }
                    }
                    static template = '<div><x-l list="{{list | square}}"/></div>'
                }
            `
        }, {
            importHelpers: '/helpers',
            getModuleNamespace: (moduleSpecifier) => {
                if (/^@cases/.test(moduleSpecifier)) {
                    return moduleSpecifier.replace(/^@cases/, '\\san').replace(/-/g, '_').replace(/\//g, '\\') + '\\'
                }
            }
        })
        expect(result).toContain('\\san\\multi_component_files\\SanSSRClasslist\\renderXList')
        expect(result).toContain('\\san\\multi_files\\square\\square($num)')
    })

    it('should not bundle dependency', function () {
        const result = compileSourceFile({
            filePath: '/stub/c.comp.ts',
            fileContent: `
                import { Component } from 'san'
                import { sum } from './sum'

                export default class C extends Component {
                    public static template = 'B'
                    someMethod () {
                        sum(2, 3)
                    }
                }`
        })
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
