module.exports = {
    roots: [
        '<rootDir>/test'
    ],
    testMatch: [
        '<rootDir>/test/unit/**/*.ts',
        '<rootDir>/test/e2e.spec.ts'
    ],
    collectCoverageFrom: [
        'src/**/*.ts'
    ],
    globals: {
        tsConfig: {
            skipLibCheck: true,
            skipDefaultLibCheck: true
        }
    }
}