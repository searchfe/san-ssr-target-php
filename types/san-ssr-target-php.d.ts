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
    constructor (...args: any[])
    initData?(): any
    inited?(): void
    getComponentType?(aNode: ANode): ComponentConstructor<{}, {}>
    parentComponent?: SanSSRComponent
    components: {
        [key: string]: SanSSRComponent
    }
    data: SanSSRData
    // 以下方法、属性都是在浏览器端运行时需要
    el?: HTMLElement
    fire(eventName: string, eventData: any): void
    dispatch(eventName: string, eventData: any): void
    on(eventName: string, listener: any): void
    un(eventName: string, listener?: any): void
    watch(propName: string, watcher: (newValue: any) => any): void
    ref(refName: string): any
    slot(name?: string): Array<any>
    nextTick(doNextTick: () => any): void
}

/**
 * 组件数据声明，用于 SanSSRComponent#data
 */
export abstract class SanSSRData {
    get<T = any> (path?: string): T
    set (path: string, value: any): void
    removeAt (path: string, index: number): void
}
