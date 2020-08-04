import { writeFileSync, readFileSync, readdirSync } from 'fs'
import { resolve, join } from 'path'
import { parseSanHTML, assertDeepEqual } from 'san-ssr'
import { execFileSync } from 'child_process'
import { compile, caseRoot } from '../src/utils/case'
import debugFactory from 'debug'

const debug = debugFactory('san-ssr:integration')
const files = readdirSync(caseRoot)
const renderBin = resolve(__dirname, '../bin/render.php')

jest.setTimeout(10000)

for (const caseName of files) {
    const caseDir = resolve(caseRoot, caseName)
    const htmlPath = join(caseDir, 'expected.html')
    const ssrPath = join(caseDir, 'ssr.php')
    const [expectedData, expectedHtml] = parseSanHTML(readFileSync(htmlPath, 'utf8'))
    // Note: 编译过程要放到 it 之外，避免被 jest 注入拖慢
    // 这里要打印日志，否则 jest 打印的错误不会体现是哪个 case 失败。查看方式：
    // DEBUG=san-ssr:integration npm run integration
    debug('compiling', caseName)
    writeFileSync(ssrPath, compile(caseName))

    it(caseName, async function () {
        const got = execFileSync(renderBin, [caseName]).toString()
        const [receivedData, receivedHTML] = parseSanHTML(got)

        // assertDeepEqual 用来对比 San Data
        // PHP 关联数组为空时，JSON.stringify 后为 `[]` 而非 `{}`
        assertDeepEqual(receivedData, expectedData)
        expect(receivedHTML).toEqual(expectedHtml)
    })
}
