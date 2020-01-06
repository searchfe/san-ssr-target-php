import { SourceFile } from 'ts-morph'

/**
 * PHP SSR 期间对 Component 的类型有额外要求，比如必须是 class 而非 function。
 * 这里把源码中的 Component 替换为我们提供的 SanComponent 替换掉。
 */
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
