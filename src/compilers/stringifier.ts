export class Stringifier {
    private helpers = ''

    constructor (helpersNamespace: string) {
        this.helpers = helpersNamespace
    }

    obj (source: object) {
        let prefixComma
        let result = '['

        for (const key in source) {
            if (!source.hasOwnProperty(key) || typeof source[key] === 'undefined') {
                continue
            }

            if (prefixComma) {
                result += ','
            }
            prefixComma = 1

            const k = this.str(key)
            const v = this.any(source[key])
            result += `${k} => ${v}`
        }

        return result + ']'
    }

    arr (source: any[]) {
        let prefixComma
        let result = '['

        for (const value of source) {
            if (prefixComma) {
                result += ','
            }
            prefixComma = 1

            result += this.any(value)
        }

        return result + ']'
    }

    /**
     * 字符串值转义成 PHP 字符串字面量
     *
     * @param quote 用单引号还是双引号？
     */
    str (source: string, quote: "'" | '"' = '"') {
        const escaped = source
            .replace(/\\/g, '\\\\')
            .replace(/\n/g, '\\n')
            .replace(/\t/g, '\\t')
            .replace(/\r/g, '\\r')
        if (quote === '"') {
            return `"${escaped.replace(/"/g, `\\"`).replace(/\$/g, '\\$')}"`
        } else {
            return `'${escaped.replace(/'/g, `\\'`)}'`
        }
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
