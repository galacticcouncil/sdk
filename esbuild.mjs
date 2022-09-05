import esbuild from 'esbuild';
import { wasmLoader } from 'esbuild-plugin-wasm';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

import path from 'path';
import fs from 'fs';

const dist = join(process.cwd(), 'dist');

if (!existsSync(dist)) {
  mkdirSync(dist);
}

const wasmLoader2 = {
  name: 'wasm-loader',
  setup(build) {
    build.onResolve({ filter: /\.wasm$/ }, (args) => {
      if (args.resolveDir === '') {
        return;
      }

      return {
        path: path.isAbsolute(args.path)
          ? args.path
          : path.join(args.resolveDir, args.path),
        namespace: 'wasm-binary',
      };
    });

    build.onLoad({ filter: /.*/, namespace: 'wasm-binary' }, async (args) => ({
      contents: await fs.promises.readFile(args.path),
      loader: 'binary',
    }));

    build.onLoad({ filter: /.*/, namespace: 'wasm-stub' }, async (args) => ({
      contents: `import wasm from ${JSON.stringify(args.path)}
      export default async (imports) =>
        (await WebAssembly.instantiate(wasm, imports)).instance.exports`,
    }));
  },
};

// ESM bundle
esbuild
  .build({
    entryPoints: ['src/index.ts'],
    outfile: 'dist/index.esm.js',
    bundle: true,
    sourcemap: true,
    minify: false,
    plugins: [wasmLoader({ mode: 'embedded' })],
    format: 'esm',
    platform: 'browser',
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
