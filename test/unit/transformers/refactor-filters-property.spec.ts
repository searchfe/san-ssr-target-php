import { refactorFiltersProperty } from '../../../src/transformers/refactor-filters-property'
import { PropertyDeclaration, Project } from 'ts-morph'

describe('refactor filters property', function () {
    const proj = new Project({ addFilesFromTsConfig: false })

    it('should skip if filters property does not have initializer', function () {
        const sourceFile = proj.createSourceFile(
            '/tmp/not-exist-file', `
            class Foo {
                filters
            } `,
            { overwrite: true }
        )
        const prop = sourceFile.getClass('Foo').getProperty('filters')
        refactorFiltersProperty(prop)
        expect(prop.getFullText()).toEqual(`
                filters`)
    })

    it('should skip refactor if it is not object literal', function () {
        const sourceFile = proj.createSourceFile('/tmp/not-exist-file', `
        class Foo {
            filters = false
        }
        `, { overwrite: true })
        const prop = sourceFile.getClass('Foo').getProperty('filters')
        refactorFiltersProperty(prop)
        expect(prop.getFullText()).toEqual(`
            filters = false`)
    })

    it('should replace property initializer', function () {
        const sourceFile = proj.createSourceFile('/tmp/not-exist-file', `
        class Foo {
            filters = {
                foo: function () {
                    return this.data.get('bar')
                }
            }
        }
        `, { overwrite: true })
        const prop = sourceFile.getClass('Foo').getProperty('filters')
        refactorFiltersProperty(prop)
        expect(prop.getFullText()).toEqual(`
            filters = {
                foo: function (sanssrSelf: Foo) {
                    return sanssrSelf.data.get('bar')
                }
            }`)
    })

    it('should replace method declaration', function () {
        const sourceFile = proj.createSourceFile('/tmp/not-exist-file', `
        class Foo {
            filters = {
                foo () {
                    return this.data.get('bar')
                }
            }
        }
        `, { overwrite: true })
        const prop = sourceFile.getClass('Foo').getProperty('filters')
        refactorFiltersProperty(prop)
        expect(prop.getFullText()).toEqual(`
            filters = {
                foo (sanssrSelf: Foo) {
                    return sanssrSelf.data.get('bar')
                }
            }`)
    })

    it('should replace method declaration', function () {
        const sourceFile = proj.createSourceFile('/tmp/not-exist-file', `
        class Foo {
            filters = {
                foo () {
                    return this.data.get('bar')
                }
            }
        }
        `, { overwrite: true })
        const prop = sourceFile.getClass('Foo').getProperty('filters')
        refactorFiltersProperty(prop)
        expect(prop.getFullText()).toEqual(`
            filters = {
                foo (sanssrSelf: Foo) {
                    return sanssrSelf.data.get('bar')
                }
            }`)
    })

    it('should replace all this occurences', function () {
        const sourceFile = proj.createSourceFile('/tmp/not-exist-file', `
        class Foo {
            bar() { return 'bar' }
            filters = {
                foo () {
                    return this.bar()
                }
            }
        }
        `, { overwrite: true })
        const prop = sourceFile.getClass('Foo').getProperty('filters')
        refactorFiltersProperty(prop)
        expect(prop.getFullText()).toEqual(`
            filters = {
                foo (sanssrSelf: Foo) {
                    return sanssrSelf.bar()
                }
            }`)
    })
})
