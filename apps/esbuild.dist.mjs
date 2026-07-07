import esbuild from 'esbuild';
import { wasmLoader } from 'esbuild-plugin-wasm';

import { writeFileSync } from 'fs';

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
  minify: true,
  metafile: true,
  outdir: 'public/dist/',
  // Keep chunks at the outdir root (not a chunks/ subdir): esbuild-plugin-wasm's
  // deferred loader only resolves wasm URLs against import.meta.url when the path
  // starts with "./". A chunks/ subdir makes the path "../…wasm", which the loader
  // fetches relative to the page instead — 404 → SPA fallback → "magic word" error.
  chunkNames: '[name]-[hash]',
  logLevel: 'info',
};

await esbuild
  .build({ ...options, plugins: [wasmLoader({ mode: 'deferred' })] })
  .then(({ metafile }) => {
    writeFileSync('build-meta.json', JSON.stringify(metafile));
  });
