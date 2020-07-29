import { Component } from 'san'
import { XList } from '@cases/multi-component-files/list'
import { square } from '@cases/multi-files/square'

export default class MyComponent extends Component {
    static components = {
        'x-l': XList
    }
    static filters = {
        square: function (arr) {
            return arr.map(num => square(num))
        }
    }
    initData () {
        return {
            list: [1, 2, 3]
        }
    }
    static template = '<div><x-l list="{{list | square}}"/></div>'
}
