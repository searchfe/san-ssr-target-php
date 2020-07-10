export class Stringifier {
    private helpers = ''

    constructor (helpersNamespace: string) {
        this.helpers = helpersNamespace
    }

    obj (source: object) {
        const pairs = Object.keys(source)
            .filter(key => source[key] !== undefined)
            .map(key => {
                const k = this.str(key)
                const v = this.any(source[key])
                return `${k} => ${v}`
            })
        return '[' + pairs.join(', ') + ']'
    }

    arr (source: any[]) {
        return '[' + source.map(x => this.any(x)).join(', ') + ']'
    }

    /**
     * 字符串值转义成 PHP 字符串字面量
     *
     * @param quote 用单引号还是双引号？
     */
    str (source: string) {
        const escaped = source
            .replace(/\\/g, '\\\\')
            .replace(/\n/g, '\\n')
            .replace(/\t/g, '\\t')
            .replace(/\r/g, '\\r')
            .replace(/"/g, `\\"`)
            .replace(/\$/g, '\\$')
        return `"${escaped}"`
    }

    date (source: Date) {
        return `new ${this.helpers}\\Ts2Php_Date(` + source.getTime() + ')'
    }

    number (source: number) {
        if (isNaN(source)) return 'null'
        return '' + source
    }

    any (source: any): string {
        switch (typeof source) {
        case 'string':
            return this.str(source)

        case 'number':
            return this.number(source)

        case 'boolean':
            return source ? 'true' : 'false'

        case 'object':
            if (!source) {
                return 'null'
            }

            if (source instanceof Array) {
                return this.arr(source)
            }

            if (source instanceof Date) {
                return this.date(source)
            }

            return this.obj(source)
        }

        throw new Error('Cannot Stringify:' + source)
    }
}
