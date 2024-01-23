import esbuild from 'esbuild';
import { createProxyServer } from './esbuild.proxy.mjs';

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
