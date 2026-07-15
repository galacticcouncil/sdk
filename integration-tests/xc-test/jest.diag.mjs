import { config } from '../../jest.config.mjs';

// Same as jest.config.mjs but WITHOUT the diagnostics exclusion, to test
// whether the exclusion is load-bearing.
const xcConfig = {
  ...config,
  moduleNameMapper: {
    '^types$': '<rootDir>/../../packages/sdk-next/src/types.ts',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tsconfig.json',
      },
    ],
  },
};

export default xcConfig;
