// date init data
const san = require('san')
const MyComponent = san.defineComponent({
    filters: {
        year: function (date) {
            return date.getFullYear()
        }
    },
    template: '<div><b title="{{date|year}}">{{date|year}}</b></div>',
    initData () {
        return {
            date: new Date('1996-07-26T07:33:20.000Z')
        }
    }
})

exports = module.exports = MyComponent
