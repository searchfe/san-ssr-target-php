import { Component } from 'san'

class Item extends Component {
    static template = `<li>{{item}}</li>`
}

export default class MyComponent extends Component {
    components: {
        'x-item': Item
    }
    static template = `<div id='app'><ul><x-item s-for='item in items' item="{{item}}"/></ul></div>`
}
