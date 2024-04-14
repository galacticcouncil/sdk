import esbuild from 'esbuild';
import { esmConfig, getPackageJson } from '../../esbuild.config.mjs';

const packageJson = getPackageJson(import.meta.url);
const peerDependencies = Object.keys(packageJson.peerDependencies);
const dependencies = Object.keys(packageJson.dependencies);

const mathDependencies = dependencies.filter((v) =>
  v.startsWith('@galacticcouncil/math-')
);

const plugins = [];
const options = {
  ...esmConfig,
  bundle: true,
  sourcemap: true,
  external: Object.keys(peerDependencies).concat(mathDependencies),
};

const ctx = await esbuild.context({ ...options, plugins });
await ctx.rebuild();
await ctx.watch();
