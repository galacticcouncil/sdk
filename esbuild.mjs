import esbuild from 'esbuild';
import resolve from 'esbuild-plugin-resolve';
import { wasmLoader } from 'esbuild-plugin-wasm';

// ESM bundle
esbuild
  .build({
    entryPoints: ['src/index.ts'],
    outdir: 'dist/esm',
    bundle: true,
    sourcemap: true,
    minify: true,
    splitting: true,
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
    outfile: 'dist/cjs/index.js',
    bundle: true,
    sourcemap: true,
    minify: true,
    platform: 'node',
    target: ['node18'],
  })
  .catch(() => process.exit(1));
