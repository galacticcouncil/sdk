import esbuild from 'esbuild';
import { writeFileSync } from 'fs';
import { esmConfig, cjsConfig, getPackageJson } from '../../esbuild.config.mjs';

const packageJson = getPackageJson(import.meta.url);
const peerDependencies = packageJson.peerDependencies || {};

// ESM bundle
esbuild
  .build({
    ...esmConfig,
    bundle: true,
    external: Object.keys(peerDependencies),
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
    external: Object.keys(peerDependencies),
  })
  .catch(() => process.exit(1));
