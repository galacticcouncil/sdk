import esbuild from 'esbuild';

import { esmConfig, getPackageJson } from '../../esbuild.config.mjs';

const packageJson = getPackageJson(import.meta.url);

const plugins = [];

const options = {
  ...esmConfig,
  bundle: true,
  external: Object.keys(packageJson.peerDependencies),
};

const ctx = await esbuild.context({ ...options, plugins });
await ctx.rebuild();
await ctx.watch();
