import { RendererCompiler } from '../../../src/compilers/renderer-compiler'
import { defineComponent } from 'san'
import { SanProject } from 'san-ssr'
import { Stringifier } from '../../../src/compilers/stringifier'
import { ExprCompiler } from '../../../src/compilers/expr-compiler'

describe('RendererCompiler', () => {
    const proj = new SanProject()
    const stringifier = new Stringifier('')
    const exprCompiler = new ExprCompiler(stringifier)
    const options = { exprCompiler, stringifier } as any
    describe('#compile()', () => {
        it('should support custom renderFunctionName', () => {
            const template = '<div></div>'
            const file = proj.parseSanSourceFile(defineComponent({ template }))
            const cc = new RendererCompiler(
                file,
                { ...options, renderFunctionName: 'customRender' }
            )

            cc.compile(file.componentInfos[0])
            expect(cc.getFullText()).toContain('function customRender ($data, $noDataOutput = false, $parentCtx = [], $tagName = \'div\', $slots = []) {')
        })
    })
})
