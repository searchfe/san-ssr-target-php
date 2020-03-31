import { refactorComputedProperty } from '../../../src/transformers/refactor-computed-property'
import { PropertyDeclaration, Project } from 'ts-morph'

describe('refactor computed property', function () {
    const proj = new Project()

    it('should skip if filters property does not have initializer', function () {
        const sourceFile = proj.createSourceFile(
            '/tmp/not-exist-file', `
            class Foo {
                computed
            } `,
            { overwrite: true }
        )
        const prop = sourceFile.getClass('Foo').getProperty('computed')
        refactorComputedProperty(prop)
        expect(prop.getFullText()).toEqual(`
                computed`)
    })

    it('should skip refactor if it is not object literal', function () {
        const sourceFile = proj.createSourceFile('/tmp/not-exist-file', `
        class Foo {
            computed = false
        }
        `, { overwrite: true })
        const prop = sourceFile.getClass('Foo').getProperty('computed')
        refactorComputedProperty(prop)
        expect(prop.getFullText()).toEqual(`
            computed = false`)
    })
    it('should replace function property assignment initializer', function () {
        const sourceFile = proj.createSourceFile('/tmp/not-exist-file', `
        class Foo {
            computed = {
                foo: function () {
                    return this.data.get('bar')
                }
            }
        }
        `, { overwrite: true })
        const prop = sourceFile.getClass('Foo').getProperty('computed')
        refactorComputedProperty(prop)
        expect(prop.getFullText()).toEqual(`
            computed = {
                foo: function (sanssrSelf: Foo) {
                    return sanssrSelf.data.get('bar')
                }
            }`)
    })

    it('should skip non-function property assignment initializer', function () {
        const sourceFile = proj.createSourceFile('/tmp/not-exist-file', `
        class Foo {
            computed = {
                foo: false
            }
        }
        `, { overwrite: true })
        const prop = sourceFile.getClass('Foo').getProperty('computed')
        refactorComputedProperty(prop)
        expect(prop.getFullText()).toEqual(`
            computed = {
                foo: false
            }`)
    })

    it('should replace method declaration', function () {
        const sourceFile = proj.createSourceFile('/tmp/not-exist-file', `
        class Foo {
            computed = {
                foo () {
                    return this.data.get('bar')
                }
            }
        }
        `, { overwrite: true })
        const prop = sourceFile.getClass('Foo').getProperty('computed')
        refactorComputedProperty(prop)
        expect(prop.getFullText()).toEqual(`
            computed = {
                foo (sanssrSelf: Foo) {
                    return sanssrSelf.data.get('bar')
                }
            }`)
    })

    it('should skip non assigment/method initializer', function () {
        const sourceFile = proj.createSourceFile('/tmp/not-exist-file', `
        class Foo {
            computed = {
                foo
            }
        }
        `, { overwrite: true })
        const prop = sourceFile.getClass('Foo').getProperty('computed')
        refactorComputedProperty(prop)
        expect(prop.getFullText()).toEqual(`
            computed = {
                foo
            }`)
    })

    it('should replace all this occurences', function () {
        const sourceFile = proj.createSourceFile('/tmp/not-exist-file', `
        class Foo {
            bar() { return 'bar' }
            computed = {
                foo () {
                    return this.bar()
                }
            }
        }
        `, { overwrite: true })
        const prop = sourceFile.getClass('Foo').getProperty('computed')
        refactorComputedProperty(prop)
        expect(prop.getFullText()).toEqual(`
            computed = {
                foo (sanssrSelf: Foo) {
                    return sanssrSelf.bar()
                }
            }`)
    })
})
