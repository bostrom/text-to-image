/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  preset: 'ts-jest',
  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,
  coverageDirectory: 'coverage',
  testPathIgnorePatterns: ['node_modules/', 'dist/'],
  coveragePathIgnorePatterns: [
    'node_modules/',
    'src/tests',
    'src/@types',
    'src/index.ts',
  ],
  coverageProvider: 'v8',
};

module.exports = config;
