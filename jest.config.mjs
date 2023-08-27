export const config = {
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
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
};
