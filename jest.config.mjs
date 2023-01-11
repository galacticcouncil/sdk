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
    '!src/client/**',
    '!src/pool/polkadotApiPoolService.ts',
    '!src/pool/xyk/xykPolkadotApiClient.ts',
    '!src/pool/lbp/lbpPolkadotApiClient.ts',
    '!src/pool/omni/omniPolkadotApiClient.ts',
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
