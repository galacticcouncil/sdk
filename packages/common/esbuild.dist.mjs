import esbuild from 'esbuild';
import { writeFileSync } from 'fs';
import { esmConfig, cjsConfig } from '../../esbuild.config.mjs';
import { externalizePackages } from '../../esbuild.plugin.mjs';

const modules = [
  'src/index.ts',
  'src/utils/index.ts',
  'src/substrate/index.ts',
];

// ESM bundle
esbuild
  .build({
    ...esmConfig,
    entryPoints: modules,
    bundle: true,
    packages: 'external',
  })
  .then(({ metafile }) => {
    writeFileSync('build-meta.json', JSON.stringify(metafile));
  })
  .catch(() => process.exit(1));

// CJS bundle
esbuild
  .build({
    ...cjsConfig,
    entryPoints: modules,
    bundle: true,
    plugins: [externalizePackages()],
  })
  .catch(() => process.exit(1));
