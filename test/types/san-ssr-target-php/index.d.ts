import { ANode, SanComponent, ComponentConstructor } from 'san'

declare namespace SanSSRTargetPHP {
    /**
     * 编译过程中，业务代码使用的组件声明。
     */
    export abstract class SanSSRComponent implements SanComponent<{}> {
        initData?(): T
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
        get (path): any
        set (path, value)
    }
}

export = SanSSRTargetPHP
