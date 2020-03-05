import { ANode, ComponentConstructor } from 'san'

/**
 * 编译过程中，业务代码使用的组件数据声明。
 *
 * 为方便优化起见，实现会被 PHP runtime 代码替代。因此这里只要类型重要，实现不重要。
 */
export abstract class SanSSRComponent {
    initData?(): any
    inited?(): void
    getComponentType?(aNode: ANode): ComponentConstructor<{}, {}>
    components: {
        [key: string]: ComponentConstructor<{}, {}>
    }
    data: SanSSRData
}

/**
 * 编译过程中，业务代码使用的组件数据声明。
 */
export abstract class SanSSRData {
    get (path: string): any
    set (path: string, value: any): void
    removeAt (path: string, index: number): void
}
