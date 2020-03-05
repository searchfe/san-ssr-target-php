import { Component } from 'san'

export default class App extends Component {
    static template = `<div id='app'><ul><li s-for='item in items'>{{item}}</li></ul></div>`
}
