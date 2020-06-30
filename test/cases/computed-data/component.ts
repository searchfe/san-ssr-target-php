import { Component } from 'san'

export default class MyComponent extends Component {
    static computed = {
        realTitle: function (this: MyComponent) {
            return 'real' + this.data.get<string>('title')
        }
    }

    static template = '<div><b title="{{realTitle}}">{{realTitle}}</b></div>'
}
