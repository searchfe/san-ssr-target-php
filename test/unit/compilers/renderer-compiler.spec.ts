import { RendererCompiler } from '../../../src/compilers/renderer-compiler'
import { defineComponent } from 'san'
import { SanProject } from 'san-ssr'

describe('RendererCompiler', () => {
    const proj = new SanProject()
    describe('#emitInitDataInCompileTime()', () => {
        it('should call initData() and populate data in compile time', () => {
            const file = proj.parseSanSourceFile(defineComponent({
                template: '<div></div>',
                initData () {
                    return { foo: 'bar' }
                }
            }))
            const cc = new RendererCompiler(file, {} as any)
            cc.emitInitDataInCompileTime(file.componentInfos[0])
            expect(cc.getFullText()).toContain(`$ctx->data['foo'] = isset($ctx->data['foo']) ? $ctx->data['foo'] : 'bar'`)
        })
        it('should not throw if initData() returned null', () => {
            const file = proj.parseSanSourceFile(defineComponent({
                template: '<div></div>',
                initData () {
                    return null
                }
            }))
            const cc = new RendererCompiler(file, {} as any)
            expect(() => cc.emitInitDataInCompileTime(file.componentInfos[0])).not.toThrow()
        })
    })
    describe('#compile()', () => {
        it('should support custom renderFunctionName', () => {
            const template = '<div></div>'
            const file = proj.parseSanSourceFile(defineComponent({ template }))
            const cc = new RendererCompiler(
                file,
                { renderFunctionName: 'customRender' } as any
            )

            cc.compile(file.componentInfos[0])
            expect(cc.getFullText()).toContain(`function customRender ($data, $noDataOutput = false, $parentCtx = [], $tagName = 'div', $sourceSlots = []) {`)
        })
    })
})
