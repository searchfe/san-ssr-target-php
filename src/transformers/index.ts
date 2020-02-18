import { isReserved } from '../utils/lang'
import { refactorMemberInitializer } from './refactor-member-initializer'
import { SanSourceFile } from 'san-ssr'
import { refactorFiltersProperty } from './refactor-filters-property'
import { refactorComputedProperty } from './refactor-computed-property'
import { replaceSanModule } from './replace-san-module'

const uselessComponentProps = ['components']

export function transformAstToPHP (sourceFile: SanSourceFile) {
    replaceSanModule(sourceFile.tsSourceFile, 'san-ssr-target-php')
    sourceFile.fakeProperties.forEach(prop => prop.remove())

    for (const clazz of sourceFile.componentClassDeclarations.values()) {
        clazz.setExtends(`SanSSRComponent`)
        // clazz.addImplements(`CompiledComponent`)
        // clazz.removeExtends()

        for (const useless of uselessComponentProps) {
            const comps = clazz.getStaticProperty(useless)
            if (comps) comps.remove()
        }

        for (const prop of clazz.getProperties()) {
            if (prop.getName() === 'computed') {
                refactorComputedProperty(prop)
            } else if (prop.getName() === 'filters') {
                refactorFiltersProperty(prop)
            }
            refactorMemberInitializer(clazz, prop)
        }
    }

    for (const clazz of sourceFile.getClassDeclarations()) {
        const name = clazz.getName()
        if (isReserved(name)) {
            if (clazz.isExported()) {
                throw new Error(`${name} is a reserved keyword in PHP`)
            }
            clazz.rename(`SanSSRClass${name}`)
        }
    }
}
