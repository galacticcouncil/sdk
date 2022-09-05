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
    '!src/pool/polkadotPoolService.ts',
    '!src/pool/xyk/xykPolkadotClient.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/polkadot.ts',
  ],
  coverageReporters: ['json-summary'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
};
