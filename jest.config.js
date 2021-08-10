module.exports = {
  clearMocks: true,
  restoreMocks: true,
  coverageDirectory: 'coverage',
  moduleFileExtensions: ['js', 'ts'],
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  testRunner: 'jest-circus/runner',
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  verbose: false
}
