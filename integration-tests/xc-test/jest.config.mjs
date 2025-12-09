import { config } from '../../jest.config.mjs';

const xcConfig = {
  ...config,
  moduleNameMapper: {
    '^types$': '<rootDir>/../../packages/sdk-next/src/types.ts',
  },
};

export default xcConfig;
