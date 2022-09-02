import esbuild from 'esbuild';
import { esbuildPluginAliasPath } from 'esbuild-plugin-alias-path';

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
      esbuildPluginAliasPath({
        alias: {
          'hydra-dx-wasm/build/xyk/nodejs':
            'node_modules/hydra-dx-wasm/build/xyk/bundler',
        },
      }),
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
