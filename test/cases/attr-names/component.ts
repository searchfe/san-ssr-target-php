import { Component } from 'san'

export default class MyComponent extends Component {
    static template = `<div><b data-foo="foo" data-FOO="{{foo}}" fF_O8="fF_08"></b></div>`
    initData () {
        return { foo: 'FOO' }
    }
}
