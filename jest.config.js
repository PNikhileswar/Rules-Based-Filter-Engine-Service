module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  moduleNameMapper: {
    '^@domain/(.*)$': '<rootDir>/src/domain/$1',
    '^@parser/(.*)$': '<rootDir>/src/parser/$1',
    '^@evaluator/(.*)$': '<rootDir>/src/evaluator/$1',
    '^@repository/(.*)$': '<rootDir>/src/repository/$1',
    '^@service/(.*)$': '<rootDir>/src/service/$1',
    '^@handler/(.*)$': '<rootDir>/src/handler/$1',
  },
};
