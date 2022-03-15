module.exports = {
  clearMocks: true,
  restoreMocks: true,
  coverageDirectory: 'coverage',
  moduleFileExtensions: ['js', 'ts'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  verbose: true
}
