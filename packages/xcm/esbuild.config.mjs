import esbuild from 'esbuild';
import { esmConfig, cjsConfig, getPackageJson } from '../../esbuild.config.mjs';

const packageJson = getPackageJson(import.meta.url);

// ESM bundle
esbuild
  .build({
    ...esmConfig,
    bundle: true,
    external: Object.keys(packageJson.peerDependencies),
  })
  .catch(() => process.exit(1));

// CJS bundle
esbuild
  .build({
    ...cjsConfig,
    bundle: true,
    external: Object.keys(packageJson.peerDependencies),
  })
  .catch(() => process.exit(1));
