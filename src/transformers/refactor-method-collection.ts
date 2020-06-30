import { FunctionExpression, MethodDeclaration, TypeGuards, PropertyDeclaration } from 'ts-morph'

export function refactorMethodCollection (propertyHoldingCollection: PropertyDeclaration) {
    const methodDefs = propertyHoldingCollection.getInitializer()
    if (!methodDefs) return
    if (!TypeGuards.isObjectLiteralExpression(methodDefs)) return
    for (const prop of methodDefs.getProperties()) {
        let body: MethodDeclaration | FunctionExpression | undefined
        if (TypeGuards.isMethodDeclaration(prop)) {
            body = prop
        }
        if (TypeGuards.isPropertyAssignment(prop)) {
            const init = prop.getInitializer()!
            if (TypeGuards.isFunctionExpression(init)) body = init
        }
        if (body === undefined) continue
        const parameters = body.getParameters()
        if (parameters.length && parameters[0].getName() === 'this') {
            parameters[0].remove()
        }
        body.insertParameter(0, {
            name: 'sanssrSelf',
            type: propertyHoldingCollection.getParentOrThrow().getName()
        })
        body.forEachDescendant(node => {
            if (TypeGuards.isThisExpression(node)) {
                node.replaceWithText('sanssrSelf')
            }
        })
    }
}
