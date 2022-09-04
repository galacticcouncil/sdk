export default {
  roots: ['<rootDir>/test'],
  modulePaths: ['<rootDir>'],
  moduleDirectories: ['node_modules'],
  moduleNameMapper: {},
  testMatch: ['**/__tests__/**/*.+(ts|js)', '**/?(*.)+(spec|test).+(ts|js)'],
  transform: {
    '^.+\\.(ts)$': 'es-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageReporters: ['json-summary'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
};
