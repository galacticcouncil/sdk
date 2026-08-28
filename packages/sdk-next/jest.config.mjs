import { config } from '../../jest.config.mjs';

export default {
  ...config,
  moduleNameMapper: {
    ...(config.moduleNameMapper ?? {}),
    '^@uniswap/v3-sdk$':
      '<rootDir>/../../node_modules/@uniswap/v3-sdk/dist/cjs/src/index.js',
    '^@uniswap/sdk-core$':
      '<rootDir>/../../node_modules/@uniswap/sdk-core/dist/cjs/src/index.js',
  },
};
