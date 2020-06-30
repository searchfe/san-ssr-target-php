import { Component } from 'san'

class Folder extends Component {
    static template = '<div><h3 on-click="toggle"><slot name="title"/></h3><slot s-if="!hidden" s-for="i in repeat"/></div>'
    toggle () {
        const hidden = this.data.get('hidden')
        this.data.set('hidden', !hidden)
    }
    initData () {
        return { repeat: [1, 2] }
    }
}

export default class MyComponent extends Component {
    static components = {
        'x-folder': Folder
    }
    static template = '<div><x-folder hidden="{{folderHidden}}"><b slot="title">{{name}}</b><p>{{desc}}</p></x-folder></div>'
}
