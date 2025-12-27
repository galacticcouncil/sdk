import esbuild from 'esbuild';
import { writeFileSync } from 'fs';
import { esmConfig, cjsConfig } from '../../esbuild.config.mjs';
import { externalizePackages } from '../../esbuild.plugin.mjs';

// ESM bundle
esbuild
  .build({
    ...esmConfig,
    bundle: true,
    packages: 'external',
    inject: ['shim.src.js'],
  })
  .then(({ metafile }) => {
    writeFileSync('build-meta.json', JSON.stringify(metafile));
  })
  .catch(() => process.exit(1));

// CJS bundle
esbuild
  .build({
    ...cjsConfig,
    bundle: true,
    plugins: [externalizePackages()],
  })
  .catch(() => process.exit(1));
