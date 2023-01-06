import esbuild from 'esbuild';
import { wasmLoader } from 'esbuild-plugin-wasm';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageJson = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));

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
    minify: true,
    plugins: [wasmLoader({ mode: 'embedded' })],
    format: 'esm',
    platform: 'browser',
    target: ['esnext'],
    external: Object.keys(packageJson.peerDependencies),
  })
  .catch(() => process.exit(1));

// CJS bundle
esbuild
  .build({
    entryPoints: ['src/index.ts'],
    outfile: 'dist/index.js',
    bundle: true,
    minify: true,
    platform: 'node',
    target: ['node18'],
    external: Object.keys(packageJson.peerDependencies),
  })
  .catch(() => process.exit(1));
