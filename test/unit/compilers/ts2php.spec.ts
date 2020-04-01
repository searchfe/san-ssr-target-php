import { ExprNode } from 'san'
import { Project } from 'ts-morph'
import { PHPTranspiler } from '../../../src/compilers/ts2php'

describe('ts2php', function () {
    it('string literalize', function () {
        const cc = new PHPTranspiler()
        const proj = new Project({ addFilesFromTsConfig: false })
        const file = proj.createSourceFile('/tmp/foo.ts', `const`)
        expect(() => cc.compile(file, {}, '')).toThrow('Variable declaration list cannot be empty.')
    })
})
