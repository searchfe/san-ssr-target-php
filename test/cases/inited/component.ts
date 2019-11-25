import { Component } from 'san'

export default class MyComponent extends Component {
    inited () {
        const realTitle = 'real' + this.data.get('title')
        this.data.set('_realTitle', realTitle)
    }
    static computed = {
        realTitle: function () {
            return this.data.get('_realTitle')
        }
    }

    static template = '<div><b title="{{realTitle}}">{{realTitle}}</b></div>'
}
