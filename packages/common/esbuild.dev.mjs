import esbuild from 'esbuild';
import { esmConfig } from '../../esbuild.config.mjs';

const plugins = [];
const options = {
  ...esmConfig,
  bundle: true,
  sourcemap: true,
  packages: 'external',
};

const ctx = await esbuild.context({ ...options, plugins });
await ctx.rebuild();
await ctx.watch();
