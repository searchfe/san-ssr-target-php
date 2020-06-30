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
            const cc = new RendererCompiler(file, false, (x: any) => 'foo')
            cc.emitInitDataInCompileTime(file.componentInfos[0])
            expect(cc.getFullText()).toContain('$ctx->data["foo"] = isset($ctx->data["foo"]) ? $ctx->data["foo"] : "bar"')
        })
        it('should not throw if initData() returned null', () => {
            const file = proj.parseSanSourceFile(defineComponent({
                template: '<div></div>',
                initData () {
                    return null
                }
            }))
            const cc = new RendererCompiler(file, false, (x: any) => 'foo')
            expect(() => cc.emitInitDataInCompileTime(file.componentInfos[0])).not.toThrow()
        })
    })
})
