import { transformAstToPHP } from '../../../src/transformers/index'
import { SanSourceFile } from 'san-ssr'
import { PropertyDeclaration, Project } from 'ts-morph'

describe('refactor computed property', function () {
    const proj = new Project({ addFilesFromTsConfig: false })

    it('should not throw if ts source file not exist', function () {
        expect(() => transformAstToPHP({} as any)).not.toThrow()
    })
})
