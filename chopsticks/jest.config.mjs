import { config } from '../jest.config.mjs';

const xcConfig = {
  ...config,
  watchman: false,
  resolver: '<rootDir>/../jest.resolver.cjs',
  moduleNameMapper: {
    '^types$': '<rootDir>/../packages/sdk-next/src/types.ts',
  },
};

export default xcConfig;
