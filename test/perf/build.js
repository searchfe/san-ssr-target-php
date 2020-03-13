#!/usr/bin/env node

const camelCase = require('camelcase')
const { readdirSync, writeFileSync, existsSync } = require('fs')
const { resolve, join, basename } = require('path')
const { SanProject } = require('san-ssr')
const ToPHPCompiler = require('../..').default

const sourceFiles = readdirSync(__dirname).filter(x => x.match(/\.san\.ts$/))

const sanProject = new SanProject({
    tsConfigFilePath: resolve(__dirname, '../tsconfig.json')
})

sourceFiles.forEach(compile)

function compile (sourceFile) {
    const sourceFilePath = resolve(__dirname, sourceFile)
    const baseName = basename(sourceFile).replace('.san.ts', '')
    const targetCode = sanProject.compile(
        sourceFilePath,
        ToPHPCompiler,
        {
            nsPrefix: `san\\${camelCase(baseName)}\\`
        }
    )
    const targetFile = sourceFilePath.replace('.ts', '.php')
    writeFileSync(targetFile, targetCode)
}
