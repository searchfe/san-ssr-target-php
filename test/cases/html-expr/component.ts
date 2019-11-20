import { Component } from 'san'

export default class MyComponent extends Component {
    static template = "<div>{{ true ? '1' : '2' | raw }}3</div>"
}
