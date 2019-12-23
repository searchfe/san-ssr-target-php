import { Component } from 'san'
import { sum } from './sum'

export default class C extends Component {
    public static template = 'B'
    someMethod () {
        sum(2, 3)
    }
}
