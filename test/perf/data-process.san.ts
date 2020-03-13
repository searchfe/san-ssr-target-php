import { Component } from 'san'

export default class App extends Component {
    static template = `<div>{{stat | raw}}</div>`
    static computed = {
        stat () {
            const stat = { count: 0, seven: 0 }
            const items: number[] = this.data.get('items')
            for (const item of items) {
                stat.count += item
                if (stat.count % 7 === 0) stat.seven++
            }
            return JSON.stringify(stat)
        }
    }
}
