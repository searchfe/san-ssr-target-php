import { Component } from 'san'

export default class MyComponent extends Component {
    static filters = {
        real: function (str: string) {
            return this.data.get('real') + str
        }
    }

    static template = '<div><b title="{{title|real}}">{{title|real}}</b></div>'
}
