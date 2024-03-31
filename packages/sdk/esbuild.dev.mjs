import esbuild from 'esbuild';
import { wasmLoader } from 'esbuild-plugin-wasm';
import { esmConfig, getPackageJson } from '../../esbuild.config.mjs';

const packageJson = getPackageJson(import.meta.url);
const peerDependencies = packageJson.peerDependencies || {};

const plugins = [wasmLoader({ mode: 'deferred' })];
const options = {
  ...esmConfig,
  bundle: true,
  sourcemap: true,
  external: Object.keys(peerDependencies),
};

const ctx = await esbuild.context({ ...options, plugins });
await ctx.rebuild();
await ctx.watch();
