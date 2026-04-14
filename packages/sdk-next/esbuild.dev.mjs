import esbuild from 'esbuild';
import { esmConfig } from '../../esbuild.config.mjs';

const modules = [
  'src/index.ts',
  'src/aave/index.ts',
  'src/client/index.ts',
  'src/evm/index.ts',
  'src/farm/index.ts',
  'src/pool/index.ts',
  'src/sor/index.ts',
  'src/staking/index.ts',
  'src/tx/index.ts',
  'src/utils/index.ts',
];

const plugins = [];
const options = {
  ...esmConfig,
  entryPoints: modules,
  bundle: true,
  sourcemap: true,
  packages: 'external',
  inject: ['shim.src.js'],
};

const ctx = await esbuild.context({ ...options, plugins });
await ctx.rebuild();
await ctx.watch();
