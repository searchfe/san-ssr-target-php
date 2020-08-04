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

## Install

Supported Environment

* PHP 5 &gt;= 5.3.0, PHP 7

```bash
npm i san san-ssr san-ssr-target-php
```

## CLI Usage

Command line interface:

```bash
san-ssr --target php --compile '{"nsPrefix":"demo\\"}' ./component.ts > ssr.php
```

## Programmatic Interface

Pass `'php'` as the second parameter of SanProject
[SanProject#compile(filepath, target, options)][.compile()] method.

TypeScript:

```typescript
import { Target, SanProject } from 'san-ssr'
import { writeFileSync } from 'fs'

const project = new SanProject()
const targetCode = project.compile('src/component.ts', 'php')

writeFileSync('ssr.php', targetCode)
```

Or in JavaScript:

```typescript
import { Target, SanProject } from 'san-ssr'
import { writeFileSync } from 'fs'

const project = new SanProject()
const targetCode = project.compile('src/component.ts', 'php')

writeFileSync('ssr.php', targetCode)
```

[san]: https://github.com/baidu/san
[sanproject]: https://baidu.github.io/san-ssr/classes/_models_san_project_.sanproject.html
[compile]: https://baidu.github.io/san-ssr/classes/_models_san_project_.sanproject.html#compile