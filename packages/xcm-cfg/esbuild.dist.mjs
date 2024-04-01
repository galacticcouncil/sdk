import esbuild from 'esbuild';
import { readdirSync, writeFileSync } from 'fs';
import { esmConfig, cjsConfig, getPackageJson } from '../../esbuild.config.mjs';

const packageJson = getPackageJson(import.meta.url);
const peerDependencies = packageJson.peerDependencies || {};

const polkadotDeps = [];
readdirSync('../../node_modules/@polkadot').forEach((pckg) => {
  polkadotDeps.push('@polkadot/' + pckg);
});

// ESM bundle
esbuild
  .build({
    ...esmConfig,
    bundle: true,
    external: Object.keys(peerDependencies).concat(polkadotDeps),
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
    external: Object.keys(peerDependencies).concat(polkadotDeps),
  })
  .catch(() => process.exit(1));
