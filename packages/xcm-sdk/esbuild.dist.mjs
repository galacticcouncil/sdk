import esbuild from 'esbuild';
import { writeFileSync } from 'fs';
import { esmConfig, cjsConfig, getPackageJson } from '../../esbuild.config.mjs';

const packageJson = getPackageJson(import.meta.url);
const peerDependencies = packageJson.peerDependencies || {};
const dependencies = Object.keys(packageJson.dependencies);

const moonbeamDependencies = dependencies.filter((v) =>
  v.startsWith('@moonbeam-network/xcm-')
);

// ESM bundle
esbuild
  .build({
    ...esmConfig,
    bundle: true,
    external: Object.keys(peerDependencies).concat(moonbeamDependencies),
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
    external: Object.keys(peerDependencies).concat(moonbeamDependencies),
  })
  .catch(() => process.exit(1));
