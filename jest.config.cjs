module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'json'],
  testRunner: 'jest-circus/runner',
  snapshotSerializers: ['jest-serializer-path', 'jest-snapshot-serializer-ansi'],
  coverageDirectory: './coverage',
  coverageReporters: ['html', 'lcov', 'text'],
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
}
