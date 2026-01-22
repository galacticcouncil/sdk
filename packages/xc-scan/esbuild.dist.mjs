import esbuild from 'esbuild';
import { esmConfig } from '../../esbuild.config.mjs';

// ESM bundle
esbuild
  .build({
    ...esmConfig,
    bundle: true,
    packages: 'external',
  })
  .catch(() => process.exit(1));
