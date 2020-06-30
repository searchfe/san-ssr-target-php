import { Component } from 'san'

export default class MyComponent extends Component {
    static computed = {
        less (this: MyComponent) {
            return this.data.get<number>('normal') - 1
        },

        normal (this: MyComponent) {
            return this.data.get<number>('num')
        },

        more (this: MyComponent) {
            return this.data.get<number>('normal') + 1
        }
    }

    static template = '<div><a>{{less}}</a><u>{{normal}}</u><b>{{more}}</b></div>'
}
