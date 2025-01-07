process.env.NODE_OPTIONS = '--experimental-vm-modules';

export const config = {
  roots: ['<rootDir>'],
  modulePaths: ['<rootDir>'],
  moduleDirectories: ['node_modules'],
  preset: 'ts-jest/presets/default-esm',
  testMatch: ['**/__tests__/**/*.+(ts|js)', '**/?(*.)+(spec|test).+(ts|js)'],
};
