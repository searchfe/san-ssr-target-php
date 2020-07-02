# san-ssr-target-php
[![npm version](https://img.shields.io/npm/v/san-ssr-target-php.svg)](https://www.npmjs.org/package/san-ssr-target-php)
[![downloads](https://img.shields.io/npm/dm/san-ssr-target-php.svg)](https://www.npmjs.org/package/san-ssr-target-php)
[![Build Status](https://travis-ci.com/searchfe/san-ssr-target-php.svg?branch=master)](https://travis-ci.com/searchfe/san-ssr-target-php)
[![Coveralls](https://img.shields.io/coveralls/searchfe/san-ssr-target-php.svg)](https://coveralls.io/github/searchfe/san-ssr-target-php?branch=master)
[![dependencies](https://img.shields.io/david/searchfe/san-ssr-target-php.svg)](https://david-dm.org/searchfe/san-ssr-target-php)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/searchfe/san-ssr-target-php)
[![GitHub issues](https://img.shields.io/github/issues-closed/searchfe/san-ssr-target-php.svg)](https://github.com/searchfe/san-ssr-target-php/issues)
[![David](https://img.shields.io/david/searchfe/san-ssr-target-php.svg)](https://david-dm.org/searchfe/san-ssr-target-php)
[![David Dev](https://img.shields.io/david/dev/searchfe/san-ssr-target-php.svg)](https://david-dm.org/searchfe/san-ssr-target-php?type=dev)
[![DUB license](https://img.shields.io/dub/l/vibe-d.svg)](https://github.com/searchfe/san-ssr-target-php/blob/master/LICENSE)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#commits)

## 安装

环境要求

* PHP 5 &gt;= 5.3.0, PHP 7

```bash
npm i san san-ssr san-ssr-target-php
```

## 编程接口

[SanProject#compile(filepath, target, options)][.compile()] 方法第二参传 `'php'`，第三参为 [ToPHPCompiler 的 compileToSource() 选项][compile-options]。

TypeScript 作为输入，可以支持 method、filters、computed。

```typescript
import { Target, SanProject } from 'san-ssr'
import { writeFileSync } from 'fs'

const project = new SanProject()
const targetCode = project.compile('src/component.ts', 'php')

writeFileSync('dist/component.php', targetCode)
```

或者 JavaScript 作为输入，只支持 template:

```typescript
const { SanProject } = require('san-ssr')
import { writeFileSync } from 'fs'

const project = new SanProject()
const targetCode = project.compile('src/component.ts', 'php')

writeFileSync('dist/component.php', targetCode)
```

默认产出的 PHP 中包含了一个 helpers 运行时工具。为了避免重复产出，可以手动维护一份 helpers 并让每次编译使用外部 helpers：

```typescript
import { SanProject } from 'san-ssr'
import ToPHPCompiler from 'san-ssr-target-php'
import { writeFileSync } from 'fs'

// 指定 importHelpers，targetCode 中不产出 helpers 代码
const project = new SanProject()
const targetCode = project.compile('src/component.ts', 'php', {
    importHelpers: '\\san\\my-helpers'
})
writeFileSync('dist/component.php', targetCode)

// 单独产出一份 helpers，注意这里没有 "\\" 前缀
const helpersCode = ToPHPCompiler.emitHelpers({ namespace: 'san\\my-helpers' })
writeFileSync('dist/helpers.php', targetCode)
```

## 命令行接口

使用 `san-ssr` 命令并指定 `--target php` 即可调用目标到 PHP 的 SSR 渲染。

```bash
san-ssr --target php --compile '{"nsPrefix":"demo\\"}' ./component.ts > ssr.php
```

全局安装 `san-ssr-target-php` 后，可以用命令来产出一份 helpers：

```bash
$ san-ssr-target-php-helpers --help
san-ssr-target-php-helpers [-n <NAMESPACE>]

Options:
  --namespace, -n    Specify the namespace of helpers

Example:
$ san-ssr-target-php-helpers -n 'san\helpers'
```

## 已知问题

- `noDataOutput` 控制的数据输出中，对象序列化使用 json_encode 实现，属性顺序和 JavaScript 中可能不同
- `getTemplateType()` 需要运行时编译，不在 PHP 版本中支持。

## 贡献指南

开发依赖：

* Node.js &gt;= 8
* PHP 7
* [composer](https://getcomposer.org)

安装依赖和跑测试：

```bash
npm install
composer install
npm test
```

debug 一个用例，以 `test/cases/array-literal` 为例：

```bash
./bin/debug array-literal
```

`source ./bin/auto-complete` 来让 zsh 自动补全用例全名。

[san]: https://github.com/baidu/san
[sanproject]: https://searchfe.github.io/san-ssr-target-php/classes/_models_san_project_.sanproject.html
[compile]: https://baidu.github.io/san-ssr/classes/_models_san_project_.sanproject.html#compile
[compile-options]: https://searchfe.github.io/san-ssr-target-php/modules/_compile_options_.html#compileoptions