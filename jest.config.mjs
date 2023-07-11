export default {
  roots: ['<rootDir>/test'],
  modulePaths: ['<rootDir>'],
  moduleDirectories: ['node_modules'],
  moduleNameMapper: {
    '@thi.ng/cache': 'test/lib/emptyModule.ts',
  },
  testMatch: ['**/__tests__/**/*.+(ts|js)', '**/?(*.)+(spec|test).+(ts|js)'],
  transform: {
    '^.+\\.(ts)$': 'es-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/client/**',
    '!src/pool/CachingPoolService.ts',
    '!src/pool/PoolService.ts',
    '!src/pool/xyk/XykPoolClient.ts',
    '!src/pool/lbp/LbpPoolClient.ts',
    '!src/pool/omni/OmniPoolClient.ts',
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
