import esbuild from 'esbuild';
import { dotenvRun } from '@dotenv-run/esbuild';
import { writeFileSync } from 'fs';
import { esmConfig, cjsConfig } from '../../esbuild.config.mjs';

const plugins = [
  dotenvRun({
    verbose: true,
    root: '../../',
    prefix: '^GC_XCM_',
  }),
];

// ESM bundle
esbuild
  .build({
    ...esmConfig,
    bundle: true,
    inject: ['shim.src.js'],
    plugins: plugins,
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
    plugins: plugins,
    packages: 'external',
  })
  .catch(() => process.exit(1));
