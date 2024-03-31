import esbuild from 'esbuild';
import { copy } from 'esbuild-plugin-copy';
import { createProxyServer } from '../../esbuild.proxy.mjs';

const plugins = [
  copy({
    resolveFrom: 'cwd',
    assets: {
      from: ['../../node_modules/@galacticcouncil/sdk/build/*.wasm'],
      to: ['./out'],
    },
    watch: true,
    once: true,
  }),
];

const plugins = [];

const options = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'esnext',
  preserveSymlinks: true,
  treeShaking: true,
  sourcemap: true,
  outdir: 'out/',
  logLevel: 'info',
};

const ctx = await esbuild.context({ ...options, plugins });
await ctx.rebuild();
await ctx.watch();
const localServer = await ctx.serve({ servedir: './', host: '127.0.0.1' });
createProxyServer(localServer);
