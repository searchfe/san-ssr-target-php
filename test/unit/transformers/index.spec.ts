import { transformToFavorPHP } from '../../../src/transformers/index'
import { SanSourceFile } from 'san-ssr'
import { PropertyDeclaration, Project } from 'ts-morph'

describe('.transformToFavorPHP()', function () {
    const proj = new Project({ addFilesFromTsConfig: false })

    it('should not throw if ts source file not exist', function () {
        expect(() => transformToFavorPHP({} as any)).not.toThrow()
    })
})
