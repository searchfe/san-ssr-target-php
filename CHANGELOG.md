## [2.3.2](https://github.com/searchfe/san-ssr-target-php/compare/v2.3.1...v2.3.2) (2020-11-25)


### Bug Fixes

* change string '+' operator to '.' ([2737b08](https://github.com/searchfe/san-ssr-target-php/commit/2737b08c6f4b2a3f0bec8eb01d7b1013a62c14e2))

## [2.3.1](https://github.com/searchfe/san-ssr-target-php/compare/v2.3.0...v2.3.1) (2020-11-20)


### Bug Fixes

* script 内容跳过转义，见 https://github.com/baidu/san-ssr/issues/73 ([3597804](https://github.com/searchfe/san-ssr-target-php/commit/35978049fde2a6c6a34c21da91d749150fbeb94c))

# [2.3.0](https://github.com/searchfe/san-ssr-target-php/compare/v2.2.4...v2.3.0) (2020-11-11)


### Features

* s-is directive ([5c848a5](https://github.com/searchfe/san-ssr-target-php/commit/5c848a5a64f755028f8507f77af297e526ac0d6e))

## [2.2.4](https://github.com/searchfe/san-ssr-target-php/compare/v2.2.3...v2.2.4) (2020-10-26)


### Bug Fixes

* this.fire error ([590cf9c](https://github.com/searchfe/san-ssr-target-php/commit/590cf9c61bab2fb2b72f0bc14ad241fb6049ccd0))

## [2.2.3](https://github.com/searchfe/san-ssr-target-php/compare/v2.2.2...v2.2.3) (2020-08-28)


### Bug Fixes

* literal property and raw output ([c899e0f](https://github.com/searchfe/san-ssr-target-php/commit/c899e0fbf6248598cfa787a37b477da00390e998))

## [2.2.2](https://github.com/searchfe/san-ssr-target-php/compare/v2.2.1...v2.2.2) (2020-08-19)


### Bug Fixes

* upgrade to ts2php@0.29.0 ([830baf4](https://github.com/searchfe/san-ssr-target-php/commit/830baf4f804ec15b18c2409b2003a4e5c8da3dcd))

## [2.2.1](https://github.com/searchfe/san-ssr-target-php/compare/v2.2.0...v2.2.1) (2020-08-04)


### Bug Fixes

* upgrade dependencies ([c6e00e3](https://github.com/searchfe/san-ssr-target-php/commit/c6e00e32090ed4404395f5538e9bb70635ff0f7c))

# [2.2.0](https://github.com/searchfe/san-ssr-target-php/compare/v2.1.6...v2.2.0) (2020-07-27)


### Features

* 支持 getModuleNamespace() 引用单独 SSR 的组件 ([3142456](https://github.com/searchfe/san-ssr-target-php/commit/3142456bc163b66fec1d68c6a9e459128fb4231f))

## [2.1.6](https://github.com/searchfe/san-ssr-target-php/compare/v2.1.5...v2.1.6) (2020-07-10)


### Bug Fixes

* attribute value escape ([6f2d6ce](https://github.com/searchfe/san-ssr-target-php/commit/6f2d6ce3b4eb20498b88da56c8caa60f856a961f))
* 属性名带横线时，只有合并数据时带横线 ([9e80ed6](https://github.com/searchfe/san-ssr-target-php/commit/9e80ed67ee3f24a260b5e3691f54110d43affb02))

## [2.1.5](https://github.com/searchfe/san-ssr-target-php/compare/v2.1.4...v2.1.5) (2020-07-09)


### Bug Fixes

* 统一使用 PHP 单引号，区分 PHP 单引号、双引号字面量 ([6ba1982](https://github.com/searchfe/san-ssr-target-php/commit/6ba1982d2ffb344fef16ebeea3fdf15c578b291c))

## [2.1.4](https://github.com/searchfe/san-ssr-target-php/compare/v2.1.3...v2.1.4) (2020-07-09)


### Bug Fixes

* PHP 低版本不支持从属性值作为类使用 ([a7c5753](https://github.com/searchfe/san-ssr-target-php/commit/a7c5753bb716631e84b06c8e0293771a49ee46b8))

## [2.1.3](https://github.com/searchfe/san-ssr-target-php/compare/v2.1.2...v2.1.3) (2020-07-09)


### Bug Fixes

* PHP 低版本不支持从对象实例访问静态成员 ([cd8d5ce](https://github.com/searchfe/san-ssr-target-php/commit/cd8d5ce366e4cc8d69cd3c7d10c64e04145c5d25))
* prefer data to initData ([1424fe8](https://github.com/searchfe/san-ssr-target-php/commit/1424fe83c2f2652b3bc02c2cf23b83dc1b0e8ab1))
* 去除重构引起的 ts 错误，见 https://github.com/baidu/san-ssr/issues/15 ([171ccb1](https://github.com/searchfe/san-ssr-target-php/commit/171ccb1f51cbe61c78a1dc12adf10cad423645d9))

## [2.1.2](https://github.com/searchfe/san-ssr-target-php/compare/v2.1.1...v2.1.2) (2020-07-08)


### Bug Fixes

* TypeScript 静态分析中，被引用文件不存在时仍然可以编译 ([bb9ae7e](https://github.com/searchfe/san-ssr-target-php/commit/bb9ae7e42ded91cdc7cf0c7ebb0aa5cdd18ee143))

## [2.1.1](https://github.com/searchfe/san-ssr-target-php/compare/v2.1.0...v2.1.1) (2020-07-07)


### Bug Fixes

* renderFunctionName option ([c4faef9](https://github.com/searchfe/san-ssr-target-php/commit/c4faef91559f16e110dc17e6cd210e32e01f4ffc))

# [2.1.0](https://github.com/searchfe/san-ssr-target-php/compare/v2.0.1...v2.1.0) (2020-07-06)


### Features

* support san@3.9 ([48d5ef7](https://github.com/searchfe/san-ssr-target-php/commit/48d5ef77ebb71d9f500ba40286d2dfb2c9bc349e))

## [2.0.1](https://github.com/searchfe/san-ssr-target-php/compare/v2.0.0...v2.0.1) (2020-07-02)


### Bug Fixes

* add san as dependency ([1b86f9b](https://github.com/searchfe/san-ssr-target-php/commit/1b86f9b9029fb61fbdf96dc9871dbdc671f7f2ad))

# [2.0.0](https://github.com/searchfe/san-ssr-target-php/compare/v1.8.0...v2.0.0) (2020-07-02)


### Features

* single source file compile ([a31cb0c](https://github.com/searchfe/san-ssr-target-php/commit/a31cb0c53aec53cf0f20e8a778b4acbea93229b1))


### BREAKING CHANGES

* - 输入源文件不再打包，不再寻找并编译它的依赖
- emitContent 不再可用，如果不输出运行时需要使用 importHelpers

# [1.8.0](https://github.com/searchfe/san-ssr-target-php/compare/v1.7.0...v1.8.0) (2020-06-15)


### Features

* <fragment> support, [#14](https://github.com/searchfe/san-ssr-target-php/issues/14) ([0b57074](https://github.com/searchfe/san-ssr-target-php/commit/0b57074382f96120fc72f74bb7567981d1bff3fa))
* component as root element, [#13](https://github.com/searchfe/san-ssr-target-php/issues/13) ([f36fb47](https://github.com/searchfe/san-ssr-target-php/commit/f36fb47fa879dae24199c8ac531ca26ac2e41801))
* ssrOnly, [#12](https://github.com/searchfe/san-ssr-target-php/issues/12) ([e073cf8](https://github.com/searchfe/san-ssr-target-php/commit/e073cf817e3f4199d9a077fb0b899170bbb9d770))

# [1.7.0](https://github.com/searchfe/san-ssr-target-php/compare/v1.6.0...v1.7.0) (2020-03-11)


### Features

* remove data output, +286.261% -> +209.032 ([8279e3c](https://github.com/searchfe/san-ssr-target-php/commit/8279e3c17e1793d56b93910cd0ee3edc852624ec))

# [1.6.0](https://github.com/searchfe/san-ssr-target-php/compare/v1.5.2...v1.6.0) (2020-03-05)


### Bug Fixes

* type for components property ([a5702a4](https://github.com/searchfe/san-ssr-target-php/commit/a5702a4d4012320e6904faea11b9379e3b2d9ebf))


### Features

* data.removeAt() during SSR ([371d4eb](https://github.com/searchfe/san-ssr-target-php/commit/371d4eb9082bfd8c46a8254715198c27466aa582))


### Performance Improvements

* benchmark for san-ssr-target-php and smarty ([cb7121a](https://github.com/searchfe/san-ssr-target-php/commit/cb7121a56a99af44fc02ac23d57272a7473ea9b0))

## [1.5.2](https://github.com/searchfe/san-ssr-target-php/compare/v1.5.1...v1.5.2) (2020-02-28)


### Bug Fixes

* $ctx->data refer to $data by reference ([b6435c8](https://github.com/searchfe/san-ssr-target-php/commit/b6435c885c184a64030e1a2b05a88a1bbbdf4e57))

## [1.5.1](https://github.com/searchfe/san-ssr-target-php/compare/v1.5.0...v1.5.1) (2020-02-28)


### Performance Improvements

* move data access seq to compile time ([3e00e81](https://github.com/searchfe/san-ssr-target-php/commit/3e00e817b170c6a16677d2a0ff94e118d8a97a6c))

# [1.5.0](https://github.com/searchfe/san-ssr-target-php/compare/v1.4.3...v1.5.0) (2020-02-28)


### Bug Fixes

* always _::extend variables insteadof literals ([139c79c](https://github.com/searchfe/san-ssr-target-php/commit/139c79ca8506fce5c716c34a85316663cb3ab5cc))


### Features

* use associate array for data representation ([624104f](https://github.com/searchfe/san-ssr-target-php/commit/624104f0ce91eaa161e7971a2ab5359d7c854909))

## [1.4.3](https://github.com/searchfe/san-ssr-target-php/compare/v1.4.2...v1.4.3) (2020-02-20)


### Bug Fixes

* use fixed version of ts-morph ([ccb9af7](https://github.com/searchfe/san-ssr-target-php/commit/ccb9af74c5fe9021bad96323dbb1a6f4893d7590))

## [1.4.2](https://github.com/searchfe/san-ssr-target-php/compare/v1.4.1...v1.4.2) (2020-01-06)


### Bug Fixes

* get rid of php-specific types from san-ssr ([c694d22](https://github.com/searchfe/san-ssr-target-php/commit/c694d22eef0bd090ed34358093d25b4185315d6e))

## [1.4.1](https://github.com/searchfe/san-ssr-target-php/compare/v1.4.0...v1.4.1) (2020-01-03)


### Bug Fixes

* self as first parameter to avoid optional filter parameters ([8b77988](https://github.com/searchfe/san-ssr-target-php/commit/8b779886725faa34f0aa2a62d4c0a95bca6d59f2))

# [1.4.0](https://github.com/searchfe/san-ssr-target-php/compare/v1.3.0...v1.4.0) (2020-01-03)


### Features

* this in filters ([5c6a3db](https://github.com/searchfe/san-ssr-target-php/commit/5c6a3db60a007ebaa02006e7fce62194c37230d7))

# [1.3.0](https://github.com/searchfe/san-ssr-target-php/compare/v1.2.1...v1.3.0) (2020-01-02)


### Features

* fully functional this in computed functions ([0a4d8be](https://github.com/searchfe/san-ssr-target-php/commit/0a4d8be24e2ed631253fda5be4ae6d133b230623))

## [1.2.1](https://github.com/searchfe/san-ssr-target-php/compare/v1.2.0...v1.2.1) (2019-12-24)


### Bug Fixes

* falsy attributes treatment, see https://github.com/searchfe/san-ssr/issues/31 ([e51f381](https://github.com/searchfe/san-ssr-target-php/commit/e51f38106f7250e6308e6d1b0db0184447226cbd))

# [1.2.0](https://github.com/searchfe/san-ssr-target-php/compare/v1.1.2...v1.2.0) (2019-12-13)


### Features

* noTemplateOutput option infavor of [#4](https://github.com/searchfe/san-ssr-target-php/issues/4) ([d4fd565](https://github.com/searchfe/san-ssr-target-php/commit/d4fd565171b0e0c9ff35fed810e8c18bb33c1664))

## [1.1.2](https://github.com/searchfe/san-ssr-target-php/compare/v1.1.1...v1.1.2) (2019-12-12)


### Performance Improvements

* upgrade ts2php ([888b9f3](https://github.com/searchfe/san-ssr-target-php/commit/888b9f348f12ad3644b03a727b526682008b2414))

## [1.1.1](https://github.com/searchfe/san-ssr-target-php/compare/v1.1.0...v1.1.1) (2019-11-25)


### Bug Fixes

* delete init() in compile time, working for [#3](https://github.com/searchfe/san-ssr-target-php/issues/3) ([ff22d0d](https://github.com/searchfe/san-ssr-target-php/commit/ff22d0deb8c53f736fd6029cd7ca695b4741c560))

# [1.1.0](https://github.com/searchfe/san-ssr-target-php/compare/v1.0.0...v1.1.0) (2019-11-25)


### Features

* call inited() in runtime, fixes [#3](https://github.com/searchfe/san-ssr-target-php/issues/3) ([f4e0471](https://github.com/searchfe/san-ssr-target-php/commit/f4e0471d5325910aa2acc671fdd33a097d893b45))

# 1.0.0 (2019-11-21)


### Bug Fixes

* add parenthesis when joining text segments, fixes [#1](https://github.com/searchfe/san-ssr-target-php/issues/1) ([3e3eb5e](https://github.com/searchfe/san-ssr-target-php/commit/3e3eb5eb86990e3837589c7b4db8443359354c18))
