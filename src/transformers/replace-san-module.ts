import { SourceFile } from 'ts-morph'

export function replaceSanModule (sourceFile: SourceFile, sanssr: string) {
    if (!sourceFile.getImportDeclaration(decl => decl.getModuleSpecifierValue() === sanssr)) {
        sourceFile.addImportDeclaration({
            namedImports: ['SanComponent'],
            moduleSpecifier: sanssr
        })
    }
    const sanImport = sourceFile.getImportDeclaration('san')
    if (sanImport) {
        sanImport.remove()
    }
}
