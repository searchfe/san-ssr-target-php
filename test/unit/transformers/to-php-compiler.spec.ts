import { SanProject } from 'san-ssr'
import ToPHPCompiler, { EmitContent } from '../../../src/index'
import { Project } from 'ts-morph'
import { resolve } from 'path'

const fromTestDir = x => resolve(__dirname, '../..', x)

const tsConfigFilePath = fromTestDir('tsconfig.json')

const compileComponent = (file: string, options = {}) => {
    const proj = new SanProject({ tsConfigFilePath })
    const cc = ToPHPCompiler.fromSanProject(proj)

    const filepath = fromTestDir(file)
    const app = proj.parseSanApp(filepath)

    return cc.compile(app, { emitContent: EmitContent.component, ...options })
}

describe('ToPHPCompiler', function () {
    it('should compile a component file', function () {
        const result = compileComponent('stub/a.comp.ts')

        expect(result).toContain('namespace san\\stub\\aComp {')
        expect(result).toContain('class A extends SanComponent {')
        expect(result).toContain(`\\san\\runtime\\ComponentRegistry::$comps[0] = '\\san\\stub\\aComp\\A'`)
    })

    it('should compile filters into static methods', function () {
        const result = compileComponent('stub/filters.comp.ts')

        expect(result).toContain('A::$filters = array(')
        expect(result).toContain('A::$filters = array(')
        expect(result).toContain('"add" => function ($x, $y){')
    })

    it('should respect modules config for ts2php', function () {
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
})
