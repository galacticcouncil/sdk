import esbuild from 'esbuild';
import { dotenvRun } from '@dotenv-run/esbuild';

import { esmConfig, getPackageJson } from '../../esbuild.config.mjs';

const packageJson = getPackageJson(import.meta.url);
const peerDependencies = packageJson.peerDependencies || {};

const plugins = [
  dotenvRun({
    verbose: true,
    root: '../../',
    prefix: '^GC_XCM_',
  }),
];

const options = {
  ...esmConfig,
  bundle: true,
  sourcemap: true,
  plugins: plugins,
  inject: ['shim.src.js'],
  external: Object.keys(peerDependencies),
};

const ctx = await esbuild.context({ ...options, plugins });
await ctx.rebuild();
await ctx.watch();
