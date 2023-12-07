import esbuild from 'esbuild';

import { esmConfig, getPackageJson } from '../../esbuild.config.mjs';

const packageJson = getPackageJson(import.meta.url);
const peerDependencies = packageJson.peerDependencies || {};

const plugins = [];

const options = {
  ...esmConfig,
  bundle: true,
  external: Object.keys(peerDependencies),
};

const ctx = await esbuild.context({ ...options, plugins });
await ctx.rebuild();
await ctx.watch();
