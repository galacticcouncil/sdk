import { config } from '../../jest.config.mjs';

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
        // The resolver maps @galacticcouncil/* to their TypeScript sources, so
        // ts-jest typechecks those packages as a side effect of running this
        // suite — and a type error in any of them blocks the run. They're
        // checked by their own builds; only report diagnostics for our code.
        diagnostics: {
          exclude: ['**/packages/**'],
        },
      },
    ],
  },
};

export default xcConfig;
