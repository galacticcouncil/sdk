import esbuild from 'esbuild';
import { esmConfig } from '../../esbuild.config.mjs';

const modules = [
  'src/index.ts',
  'src/utils/index.ts',
  'src/substrate/index.ts',
];

const plugins = [];
const options = {
  ...esmConfig,
  entryPoints: modules,
  bundle: true,
  sourcemap: true,
  packages: 'external',
};

const ctx = await esbuild.context({ ...options, plugins });
await ctx.rebuild();
await ctx.watch();
