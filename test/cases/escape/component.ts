import { Component } from 'san'

export default class MyComponent extends Component {
    static template = `<div>line\\\n  <a href="href&quot;&<>'\\">content&quot;>&lt;</a></div>`
}
