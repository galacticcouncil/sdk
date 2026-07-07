import esbuild from 'esbuild';
import { wasmLoader } from 'esbuild-plugin-wasm';
import { createProxyServer } from '../esbuild.proxy.mjs';

const plugins = [wasmLoader({ mode: 'deferred' })];

const options = {
  entryPoints: [
    { in: 'src/redeem/app.ts', out: 'redeem' },
    { in: 'src/moxit/app.ts', out: 'moxit' },
  ],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'esnext',
  treeShaking: true,
  splitting: true,
  sourcemap: true,
  outdir: 'public/dist/',
  // Keep chunks at the outdir root (not a chunks/ subdir): esbuild-plugin-wasm's
  // deferred loader only resolves wasm URLs against import.meta.url when the path
  // starts with "./". A chunks/ subdir makes the path "../…wasm", which the loader
  // fetches relative to the page instead — 404 → SPA fallback → "magic word" error.
  chunkNames: '[name]-[hash]',
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
