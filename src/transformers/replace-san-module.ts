import { SourceFile } from 'ts-morph'

/**
 * 把源码中的 Component 替换为我们提供的 SanSSRComponent。作用：
 *
 * 1. PHP SSR 只支持部分功能，有白名单的功效，不支持的功能编译期拒绝
 * 2. Component 在 PHP 里需要是 class 而非 interface，因为我们需要基类成员
 */
export function replaceSanModule (sourceFile: SourceFile, sanssr: string) {
    if (!sourceFile.getImportDeclaration(decl => decl.getModuleSpecifierValue() === sanssr)) {
        sourceFile.addImportDeclaration({
            namedImports: ['SanSSRComponent'],
            moduleSpecifier: sanssr
        })
    }
    const sanImport = sourceFile.getImportDeclaration('san')
    if (sanImport) {
        sanImport.remove()
    }
}
