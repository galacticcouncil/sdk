import esbuild from 'esbuild';
import resolve from 'esbuild-plugin-resolve';
import { wasmLoader } from 'esbuild-plugin-wasm';

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const dist = join(process.cwd(), 'dist');

if (!existsSync(dist)) {
  mkdirSync(dist);
}

// ESM bundle
esbuild
  .build({
    entryPoints: ['src/index.ts'],
    outfile: 'dist/index.esm.js',
    bundle: true,
    sourcemap: true,
    minify: true,
    plugins: [
      resolve({
        './math/nodejs': './math/bundler',
      }),
      wasmLoader({ mode: 'deferred' }),
    ],
    format: 'esm',
    target: ['esnext'],
  })
  .catch(() => process.exit(1));

// CJS bundle
esbuild
  .build({
    entryPoints: ['src/index.ts'],
    outfile: 'dist/index.js',
    bundle: true,
    sourcemap: true,
    minify: true,
    platform: 'node',
    target: ['node18'],
  })
  .catch(() => process.exit(1));
