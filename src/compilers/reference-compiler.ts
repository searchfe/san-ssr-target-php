import { ComponentReference } from 'san-ssr'
import { NormalizedCompileOptions } from '../compile-options'
import { dirname, resolve } from 'path'
import { getNamespace, normalizeNamespaceSlug } from '../utils/lang'

export class ReferenceCompiler {
    constructor (
        private currentFilePath: string,
        private options: NormalizedCompileOptions
    ) {}

    compileToFunctionFullName (ref: ComponentReference) {
        const fnName = ref.id === 'default' ? 'render' : 'render' + ref.id
        const fnFullName = '\\' + this.getNamespace(ref.specifier) + '\\' + fnName
        return fnFullName
    }

    /**
     * 根据组件引用（通常是外部组件）得到被引用组件的命名空间
     */
    private getNamespace (specifier: string): string {
        let ns = ''
        const ret = this.options.getModuleNamespace(specifier)
        ns = ret.replace(/^\\/, '').replace(/\\$/, '').split('\\').map(normalizeNamespaceSlug).join('\\')
        if (!ns) {
            const filePath = specifier === '.' ? this.currentFilePath : resolve(dirname(this.currentFilePath), specifier)
            ns = getNamespace(this.options.nsPrefix, this.options.nsRootDir, filePath)
        }
        return ns
    }
}
