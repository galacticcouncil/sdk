import esbuild from 'esbuild';
import { wasmLoader } from 'esbuild-plugin-wasm';

import { writeFileSync } from 'fs';

const options = {
  entryPoints: [{ in: 'src/redeem/app.ts', out: 'redeem' }],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'esnext',
  treeShaking: true,
  splitting: true,
  minify: true,
  metafile: true,
  outdir: 'public/dist/',
  chunkNames: 'chunks/[name]-[hash]',
  logLevel: 'info',
};

await esbuild
  .build({ ...options, plugins: [wasmLoader({ mode: 'deferred' })] })
  .then(({ metafile }) => {
    writeFileSync('build-meta.json', JSON.stringify(metafile));
  });
