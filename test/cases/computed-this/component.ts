import { Component } from 'san'

export default class MyComponent extends Component {
    realTitle () {
        return 'real' + this.data.get<string>('title')
    }
    static computed = {
        realTitle: function (this: MyComponent) {
            return this.realTitle()
        }
    }

    static template = '<div><b title="{{realTitle}}">{{realTitle}}</b></div>'
}
