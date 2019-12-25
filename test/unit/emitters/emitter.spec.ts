import { PHPEmitter } from '../../../src/emitters/emitter'
import { emit } from 'cluster';

describe('PHPEmitter', function () {
    let emitter;
    beforeEach(function () {
        emitter = new PHPEmitter()
    })

    describe('write html literal', function () {
        it('should write no buffer html literal', function () {
            emitter.write('foo')
    
            expect(emitter.fullText()).toEqual('foo')
        })
    
        it('should write buffer html literal', function () {
            emitter.bufferHTMLLiteral('foo')
            emitter.write('bar')
    
            expect(emitter.fullText()).toEqual('$html .= "foo";\nbar')
        })
    })

    it('should write data comment', function () {
        emitter.writeDataComment()

        expect(emitter.fullText()).toEqual('$html .= "<!--s-data:" . json_encode(_::data($ctx, []), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . "-->";;\n')
    })

    describe('write namespace', function () {
        it('should write namespace with ns', function () {
            emitter.writeNamespace('san', function () {
                emitter.writeLine('bar')
            })

            expect(emitter.fullText()).toEqual('namespace san {\n    bar\n}\n')
        })
        it('should write namespace without ns', function () {
            emitter.beginNamespace()
            emitter.endNamespace()

            expect(emitter.fullText()).toEqual('namespace {\n}\n')
        })
    })
   
    describe('write switch case', function () {
        it('should write switch', function() {
            emitter.writeSwitch('type', function () {
                emitter.writeLine('case:t')
            })
    
            expect(emitter.fullText()).toEqual('switch (type) {\n    case:t\n}\n')
        })

        it('should write case without body', function () {
            emitter.writeCase('1')

            expect(emitter.fullText()).toEqual('case 1:\n')
        })

        it('should write case with break body', function () {
            emitter.writeCase('1', function () {
                emitter.writeBreak()
            })

            expect(emitter.fullText()).toEqual('case 1:\n    break;\n')
        })

        it('should write default without body', function () {
            emitter.writeDefault()

            expect(emitter.fullText()).toEqual('default:\n')
        })

        it('should write default with body', function () {
            emitter.writeDefault(function () {
                emitter.writeLine('foo')
            })

            expect(emitter.fullText()).toEqual('default:\n    foo\n')
        })

        it('should write no indent before default', function () {
            emitter.writeCase('1', function () {
                emitter.writeBreak()
            })

            emitter.writeDefault(function () {
                emitter.writeLine('foo')
            })

            emitter.writeLine('bar')

            expect(emitter.fullText()).toEqual('case 1:\n    break;\ndefault:\n    foo\nbar\n')
        })
    })

    describe('write function', function () {
        it('should write function without arguments', function () {
            emitter.writeFunction()

            expect(emitter.fullText()).toEqual('function () {\n}')
        })

        it('should write function with only name', function () {
            emitter.writeFunction('bar')

            expect(emitter.fullText()).toEqual('function bar () {\n}')
        })

        it('should write function with arguments', function () {
            emitter.writeFunction('bar', ['a', 'b'], ['foo1', 'foo2'], function () {
                emitter.writeLine('echo');
            })

            expect(emitter.fullText()).toEqual('function bar (a, b) use (foo1, foo2) {\n    echo\n}')
        })

        it('should write anonymous function', function () {
            emitter.writeAnonymousFunction()

            expect(emitter.fullText()).toEqual('function () {\n}')
        })

        it('should write function call', function () {
            emitter.writeFunctionCall('bar', ['foo1', 'foo2'])
    
            expect(emitter.fullText()).toEqual('bar(foo1, foo2)')
        })
    })

    describe('write if', function () {
        it('should write if', function () {
            emitter.writeIf('foo', function () {
                emitter.writeLine('bar')
            })

            expect(emitter.fullText()).toEqual('if (foo) {\n    bar\n}\n')
        })

        it('should write else if', function () {
            emitter.writeIf('foo', function () {
                emitter.writeLine('bar')
            })

            emitter.beginElseIf('bar')
            emitter.endIf()

            expect(emitter.fullText()).toEqual('if (foo) {\n    bar\n}\nelse if (bar) {\n}\n')
        })

        it('should write else', function () {
            emitter.writeIf('foo', function () {
                emitter.writeLine('bar')
            })

            emitter.beginElse()
            emitter.endIf()

            expect(emitter.fullText()).toEqual('if (foo) {\n    bar\n}\nelse {\n}\n')
        })
    })

    describe('write foreach', function () {
        it('should write foreach', function () {
            emitter.writeForeach('lists as list', function () {
                emitter.writeLine('list')
            })

            expect(emitter.fullText()).toEqual('foreach (lists as list) {\n    list\n}\n')
        })

        it('should write continue', function () {
            emitter.writeContinue()

            expect(emitter.fullText()).toEqual('continue;\n')
        })
    })

    it('should write block', function () {
        emitter.writeBlock('foo', function () {
            emitter.writeLine('bar')
        })

        expect(emitter.fullText()).toEqual('foo {\n    bar\n}\n')
    })
}) 