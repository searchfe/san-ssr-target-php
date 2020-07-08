/**
 * 给 ts2php 看的 san-ssr-target-php 的类型。
 *
 * Note:
 *
 * - 必须放到 types/san-ssr-target-php 下，让 e2e 测试时可以 import 'san-ssr-target-php'
 * - 只提供类型，实现采用 PHP 以提升优化空间，源码见：runtime/san.php
 * - 'san' 里的 Component 必须换成该 SanSSRComponent，因为 ts2php 需要基类是一个 class 而非 interface
 */
import { ANode, ComponentConstructor } from 'san'

/**
 * 组件基类声明，输入源码重构后，进入 ts2php 之前，需要继承自 SanSSRComponent
 */
export abstract class SanSSRComponent {
    initData?(): any
    inited?(): void
    getComponentType?(aNode: ANode): ComponentConstructor<{}, {}>
    components: {
        [key: string]: SanSSRComponent
    }
    data: SanSSRData
}

/**
 * 组件数据声明，用于 SanSSRComponent#data
 */
export abstract class SanSSRData {
    get<T = any> (path: string): T
    set (path: string, value: any): void
    removeAt (path: string, index: number): void
}
