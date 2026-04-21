import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const PACKAGE = 'package.json';
const ENCODING = 'utf-8';

export function getPackageJson(metaUrl) {
  const fileName = fileURLToPath(metaUrl);
  const dirName = dirname(fileName);
  const absPath = resolve(dirName, PACKAGE);
  const file = readFileSync(absPath, ENCODING);
  return JSON.parse(file);
}

const common = {
  entryPoints: ['src/index.ts'],
  preserveSymlinks: true,
  treeShaking: true,
  minify: true,
  metafile: true,
  logLevel: 'info',
};

export const esmConfig = {
  ...common,
  outdir: 'build',
  outExtension: { '.js': '.mjs' },
  format: 'esm',
  platform: 'browser',
  target: ['esnext'],
  logLevel: 'info',
};

export const cjsConfig = {
  ...common,
  outdir: 'build',
  outExtension: { '.js': '.cjs' },
  format: 'cjs',
  platform: 'node',
  target: ['node18'],
  logLevel: 'info',
};
