import esbuild from 'esbuild';
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
  .catch(() => process.exit(1));

// CJS bundle
esbuild
  .build({
    ...cjsConfig,
    bundle: true,
    external: Object.keys(peerDependencies),
  })
  .catch(() => process.exit(1));
