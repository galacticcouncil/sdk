import esbuild from 'esbuild';
import { writeFileSync } from 'fs';
import { wasmLoader } from 'esbuild-plugin-wasm';
import { createProxyServer } from '../../esbuild.proxy.mjs';

const plugins = [wasmLoader({ mode: 'deferred' })];

const options = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  preserveSymlinks: true,
  treeShaking: true,
  metafile: true,
  minify: true,
  splitting: true,
  sourcemap: true,
  outdir: 'public/',
  logLevel: 'info',
};

const ctx = await esbuild.context({ ...options, plugins });
const opts = await ctx.rebuild();
writeFileSync('build-meta.json', JSON.stringify(opts.metafile));
await ctx.watch();
const localServer = await ctx.serve({
  servedir: './public',
  host: '127.0.0.1',
});
createProxyServer(localServer);
