import { Modules } from './compilers/ts2php'

export interface CompileOptions {
    /**
     * 自定义 render 的函数名。默认为 `render`
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
}

/**
 * 解析过的，填充过默认值的 CompileOptions，程序内部使用
 */
export interface NormalizedCompileOptions extends CompileOptions {
    renderFunctionName: string,
    nsPrefix: string,
    nsRootDir: string,
    emitHeader: boolean,
    ssrOnly: boolean,
    modules: Modules
}

export const defaultHelpersNS = 'san\\runtime'

export function normalizeCompileOptions ({
    renderFunctionName = 'render',
    nsPrefix = 'san\\',
    nsRootDir = process.cwd(),
    importHelpers,
    emitHeader = true,
    ssrOnly = false,
    modules = {}
}: CompileOptions): NormalizedCompileOptions {
    return { renderFunctionName, nsPrefix, nsRootDir, importHelpers, emitHeader, ssrOnly, modules }
}
