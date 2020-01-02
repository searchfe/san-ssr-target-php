import { Component } from 'san'

export default class MyComponent extends Component {
    realTitle () {
        return 'real' + this.data.get('title')
    }
    static computed = {
        realTitle: function () {
            return this.realTitle()
        }
    }

    static template = '<div><b title="{{realTitle}}">{{realTitle}}</b></div>'
}
