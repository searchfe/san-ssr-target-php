import { refactorComputedProperty } from '../../../src/transformers/refactor-computed-property'
import { PropertyDeclaration, Project } from 'ts-morph'

describe('refactor computed property', function () {
    const proj = new Project()

    it('should replace property initializer', function () {
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
            computed: import("san-ssr").SanSSRComputedDeclarations = {
                foo: function (sanssrSelf: Foo) {
                    return sanssrSelf.data.get('bar')
                }
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
            computed: import("san-ssr").SanSSRComputedDeclarations = {
                foo (sanssrSelf: Foo) {
                    return sanssrSelf.data.get('bar')
                }
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
            computed: import("san-ssr").SanSSRComputedDeclarations = {
                foo (sanssrSelf: Foo) {
                    return sanssrSelf.data.get('bar')
                }
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
            computed: import("san-ssr").SanSSRComputedDeclarations = {
                foo (sanssrSelf: Foo) {
                    return sanssrSelf.bar()
                }
            }`)
    })
})
