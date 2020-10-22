import { Modules } from './compilers/ts2php'
import { Stringifier } from './compilers/stringifier'
import { ExprCompiler } from './compilers/expr-compiler'

export interface CompileOptions {
    /**
     * 当传入文件名时，自定义文件内容
     */
    source?: string
    /**
     * 自定义生成的入口 render 的函数名，默认为 `render`。用于自定义 render 函数。
     *
     * 比如设置 `renderFunctionName = 'originalRender'` 并在文件尾追加：
     *
     * function render($data) {
     *     $data['foo'] = 'bar';
     *     return originalRender($data);
     * }
     */
    renderFunctionName?: string,
    /**
     * 命名空间前缀。
     * 编译得到的 PHP 所在命名空间、其他被引用的 PHP 的命名空间前缀需要保持一致。
     */
    nsPrefix?: string,
    /**
     * 命名空间前缀对应的目录。目录->命名空间转换规则：
     * - 先转 camelCase
     * - 去除结尾的 .js, .ts 后缀
     *
     * 示例:
     * nsPrefix: '\\san', nsRootDir: '/foo', 则 '/foo/bar.ts' 的命名空间为 \san\bar
     */
    nsRootDir?: string,
    /**
     * 从外部引入 helpers，文件里不再重复生成。
     * 比如：'\\san\\helpers'
     */
    importHelpers?: string,
    /**
     * 是否输出 <?php 文件头
     *
     * 如果是独立文件设为 true，如果要和其他文件拼接设为 false
     */
    emitHeader?: boolean,
    /**
     * 是否只用于 SSR，不用于浏览器端反解（即是否只当模板引擎用）。
     * 设为 true 可以节省一些用来帮助反解的 HTML 注释标记。
     */
    ssrOnly?: boolean,
    /**
     * ts2php 的 CompileOptions#modules
     */
    modules?: Modules
    /**
     * ts2php 的 CompileOptions#getModuleNamespace
     * 注意：getModuleNamespace 也作用于定位外部 render()，后两个参数不受支持
     */
    getModuleNamespace?: (moduleSpecifier: string) => string
}

/**
 * 解析过的，程序内部使用。包括：
 * 1. 填充过默认值的 CompileOptions
 * 2. 由 CompileOptions 唯一决定的工具对象
 */
export interface NormalizedCompileOptions extends CompileOptions {
    renderFunctionName: string,
    nsPrefix: string,
    nsRootDir: string,
    emitHeader: boolean,
    helpersNS: string,
    importHelpersNS: string,
    ssrOnly: boolean,
    stringifier: Stringifier,
    exprCompiler: ExprCompiler,
    modules: Modules,
    getModuleNamespace: (moduleSpecifier: string) => string
}

/**
 * 默认（importHelpers 为 falsy）情况下产出的 helpers 命名空间：
 *
 * namespace san\\helpers {
 *     class _ { }
 * }
 */
export const defaultHelpersNS = 'san\\helpers'
export const defaultImportHelpersNS = '\\san\\helpers'

export function normalizeCompileOptions ({
    renderFunctionName = 'render',
    nsPrefix = 'san\\',
    nsRootDir,
    importHelpers,
    emitHeader = true,
    ssrOnly = false,
    modules = {},
    getModuleNamespace = () => '\\'
}: CompileOptions, tsRoot: string): NormalizedCompileOptions {
    nsRootDir = nsRootDir || tsRoot
    // 定义如何引用 helpers，因此需要带 \ 前缀，比如
    // \san\helpers\_::escapeHTML('');
    const importHelpersNS = '\\' + importHelpers || '\\' + defaultImportHelpersNS
    const helpersNS = importHelpers || defaultHelpersNS
    const stringifier = new Stringifier(importHelpersNS)
    const exprCompiler = new ExprCompiler(stringifier)
    return { renderFunctionName, nsPrefix, nsRootDir, importHelpers, emitHeader, ssrOnly, modules, helpersNS, importHelpersNS, stringifier, exprCompiler, getModuleNamespace }
}
