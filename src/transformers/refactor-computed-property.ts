import { FunctionExpression, MethodDeclaration, TypeGuards, PropertyDeclaration } from 'ts-morph'

export function refactorComputedProperty (computed: PropertyDeclaration) {
    const computedDefinitions = computed.getInitializer()
    if (!computedDefinitions) return
    if (!TypeGuards.isObjectLiteralExpression(computedDefinitions)) return
    for (const prop of computedDefinitions.getProperties()) {
        let body: MethodDeclaration | FunctionExpression
        if (TypeGuards.isMethodDeclaration(prop)) {
            body = prop
        }
        if (TypeGuards.isPropertyAssignment(prop)) {
            const init = prop.getInitializer()
            if (TypeGuards.isFunctionExpression(init)) body = init
        }
        if (body) {
            body.insertParameter(0, {
                name: 'sanssrSelf',
                type: computed.getParentOrThrow().getName()
            })
            body.forEachDescendant(node => {
                if (TypeGuards.isThisExpression(node)) {
                    node.replaceWithText('sanssrSelf')
                }
            })
        }
    }
}
