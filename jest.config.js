module.exports = {
    roots: [
        '<rootDir>/test'
    ],
    testMatch: [
        '<rootDir>/test/unit/**/*.ts',
        '<rootDir>/test/integration.spec.ts'
    ],
    globals: {
        tsConfig: {
            skipLibCheck: true,
            skipDefaultLibCheck: true
        }
    }
}