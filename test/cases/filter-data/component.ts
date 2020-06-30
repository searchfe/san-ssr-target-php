import { Component } from 'san'

export default class MyComponent extends Component {
    static filters = {
        real: function (this: MyComponent, str: string) {
            return this.data.get<string>('real') + str
        }
    }

    static template = '<div><b title="{{title|real}}">{{title|real}}</b></div>'
}
