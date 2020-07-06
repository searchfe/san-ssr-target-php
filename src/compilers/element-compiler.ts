import { Directive, ANodeProperty, ANode, ExprType } from 'san'
import { ANodeCompiler } from './anode-compiler'
import { TypeGuards, autoCloseTags, getANodePropByName } from 'san-ssr'
import { expr } from '../compilers/expr-compiler'
import { PHPEmitter } from '../emitters/emitter'

/**
 * 把 ANode 作为元素来编译。这个 aNode 类型是普通 DOM 元素，可能是组件根 DOM 元素，
 * 也可能是由其他 aNode 语法编译时递归到的子 DOM 元素
 */
export class ElementCompiler {
    constructor (
        private aNodeCompiler: ANodeCompiler,
        private emitter: PHPEmitter = new PHPEmitter()
    ) {}
    /**
     * 编译元素标签头
     *
     * @param customTagName 是否自定义标签名
     */
    tagStart (aNode: ANode) {
        const props = aNode.props
        const bindDirective = aNode.directives.bind
        const tagName = aNode.tagName
        const { emitter } = this

        if (tagName) {
            emitter.writeHTMLLiteral('<' + tagName)
        } else {
            emitter.writeHTMLLiteral('<')
            emitter.writeHTMLExpression('$tagName')
        }

        const propsIndex:any = {}
        for (const prop of props) propsIndex[prop.name] = prop
        for (const prop of props) this.compileProperty(tagName, prop, propsIndex)
        if (bindDirective) this.compileBindProperties(tagName, bindDirective)
        emitter.writeHTMLLiteral('>')
    }

    /**
     * @param customTagName 是否自定义标签名
     */
    tagEnd (aNode: ANode) {
        const { emitter } = this
        const tagName = aNode.tagName

        if (tagName) {
            if (!autoCloseTags.has(tagName)) {
                emitter.writeHTMLLiteral('</' + tagName + '>')
            }
            if (tagName === 'select') {
                emitter.writeLine('$selectValue = null;')
            }
            if (tagName === 'option') {
                emitter.writeLine('$optionValue = null;')
            }
        } else {
            emitter.writeHTMLLiteral('</')
            emitter.writeHTMLExpression('$tagName')
            emitter.writeHTMLLiteral('>')
        }
    }

    // 编译元素内容
    inner (aNode: ANode) {
        if (aNode.tagName === 'textarea') {
            const valueProp = getANodePropByName(aNode, 'value')
            if (valueProp) this.emitter.writeHTMLExpression(`_::escapeHTML(${expr(valueProp.expr)})`)
            return
        }

        const htmlDirective = aNode.directives.html
        if (htmlDirective) this.emitter.writeHTMLExpression(expr(htmlDirective.value))
        else for (const aNodeChild of aNode.children!) this.aNodeCompiler.compile(aNodeChild, false)
    }

    private compileProperty (tagName: string, prop: ANodeProperty, propsIndex: { [key: string]: ANodeProperty }) {
        const { emitter } = this
        if (prop.name === 'slot') return
        if (TypeGuards.isExprBoolNode(prop.expr)) {
            emitter.writeHTMLLiteral(` ${prop.name}`)
            return
        }
        if (TypeGuards.isExprStringNode(prop.expr)) {
            emitter.writeHTMLLiteral(` ${prop.name}=${emitter.stringify(prop.expr.value)}`)
            return
        }
        if (prop.expr.value != null) {
            emitter.writeHTMLLiteral(` ${prop.name}="${expr(prop.expr)}"`)
            return
        }

        if (prop.name === 'value') {
            if (tagName === 'textarea') return
            if (tagName === 'select') {
                const val = expr(prop.expr)
                emitter.writeLine(`$selectValue = ${val} ? ${val} : '';`)
                return
            }
            if (tagName === 'option') {
                emitter.writeLine(`$optionValue = ${expr(prop.expr)};`)
                // value
                emitter.writeIf('isset($optionValue)', () => {
                    emitter.writeHTMLExpression('" value=\\"" . $optionValue . "\\""')
                })
                // selected
                emitter.writeIf('$optionValue == $selectValue', () => {
                    emitter.writeHTMLLiteral(' selected')
                })
                return
            }
        }
        if (prop.name === 'readonly' || prop.name === 'disabled' || prop.name === 'multiple') {
            emitter.writeHTMLExpression(`_::boolAttrFilter('${prop.name}', ${expr(prop.expr)})`)
            return
        }

        const valueProp = propsIndex.value
        const typeNode = propsIndex.type
        if (prop.name === 'checked' && tagName === 'input' && valueProp && typeNode) {
            if (typeNode.expr.value === 'checkbox') {
                emitter.writeIf(
                    `_::contains(${expr(prop.expr)}, ${expr(valueProp.expr)})`,
                    () => emitter.writeHTMLLiteral(' checked'))
                return
            }
            if (typeNode.expr.value === 'radio') {
                emitter.writeIf(`${expr(prop.expr)} === ${expr(valueProp.expr)}`, () => {
                    emitter.writeHTMLLiteral(' checked')
                })
                return
            }
        }
        const onlyOneAccessor = prop.expr.type === ExprType.ACCESSOR
        const needEscape = prop.x || onlyOneAccessor
        emitter.writeHTMLExpression(`_::attrFilter("${prop.name}", ${expr(prop.expr)}, ${needEscape})`)
    }

    private compileBindProperties (tagName: string, bindDirective: Directive<any>) {
        const { emitter } = this
        emitter.nextLine(`$bindObj = ${expr(bindDirective.value)};`)
        emitter.writeForeach('$bindObj as $key => $value', () => {
            emitter.writeSwitch('$key', () => {
                emitter.writeCase('"readonly"')
                emitter.writeCase('"disabled"')
                emitter.writeCase('"multiple"')
                emitter.writeCase('"checked"', () => {
                    emitter.writeLine('$html .= _::boolAttrFilter($key, $value);')
                    emitter.writeBreak()
                })
                emitter.writeDefault(() => {
                    emitter.writeLine('$html .= _::attrFilter($key, $value, true);')
                })
            })
        })
    }
}
