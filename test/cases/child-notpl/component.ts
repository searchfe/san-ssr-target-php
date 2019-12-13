import { Component } from 'san'

class List extends Component {
    static template = '<template><li s-for="item in list">{{item}}</li></template>'
}

export default class MyComponent extends Component {
    static components = {
        'x-l': List
    }
    static template = '<ul><x-l list="{{[1, true, ...ext, \'erik\', ...ext2]}}"/></ul>'
}
