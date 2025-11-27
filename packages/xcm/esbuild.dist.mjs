import esbuild from 'esbuild';
import { writeFileSync } from 'fs';
import { esmConfig, cjsConfig } from '../../esbuild.config.mjs';

// ESM bundle
esbuild
  .build({
    ...esmConfig,
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
    bundle: true,
    packages: 'external',
  })
  .catch(() => process.exit(1));
