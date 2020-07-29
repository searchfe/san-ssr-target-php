import { refactorMemberInitializer } from './refactor-member-initializer'
import { isTypedSanSourceFile, SanSourceFile } from 'san-ssr'
import { refactorMethodCollection } from './refactor-method-collection'
import { replaceSanModule } from './replace-san-module'
import { refactorReservedNames } from './refactor-reserved-names'

const uselessComponentProps = ['components']

export function transformToFavorPHP (sourceFile: SanSourceFile) {
    if (!isTypedSanSourceFile(sourceFile)) return
    replaceSanModule(sourceFile.tsSourceFile, 'san-ssr-target-php')
    refactorReservedNames(sourceFile)

    for (const clazz of sourceFile.getComponentClassDeclarations()) {
        clazz.setExtends(`SanSSRComponent`)
        for (const useless of uselessComponentProps) {
            const comps = clazz.getProperty(useless)
            if (comps) comps.remove()
        }

        for (const prop of clazz.getProperties()) {
            if (prop.getName() === 'computed') {
                refactorMethodCollection(prop)
            } else if (prop.getName() === 'filters') {
                refactorMethodCollection(prop)
            }
            refactorMemberInitializer(clazz, prop)
        }
    }
}
