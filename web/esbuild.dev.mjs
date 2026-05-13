import esbuild from 'esbuild';
import { wasmLoader } from 'esbuild-plugin-wasm';
import { createProxyServer } from '../esbuild.proxy.mjs';

const plugins = [wasmLoader({ mode: 'deferred' })];

const options = {
  entryPoints: ['src/redeem/app.ts'],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'esnext',
  treeShaking: true,
  splitting: true,
  sourcemap: true,
  outdir: 'public/dist/',
  chunkNames: 'chunks/[name]-[hash]',
  logLevel: 'info',
};

const ctx = await esbuild.context({ ...options, plugins });
await ctx.rebuild();
await ctx.watch();
const localServer = await ctx.serve({
  servedir: './public',
  host: '127.0.0.1',
});
createProxyServer(localServer);
