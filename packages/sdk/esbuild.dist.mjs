import esbuild from 'esbuild';
import { writeFileSync } from 'fs';
import { esmConfig, cjsConfig, getPackageJson } from '../../esbuild.config.mjs';

const packageJson = getPackageJson(import.meta.url);
const peerDependencies = Object.keys(packageJson.peerDependencies);
const dependencies = Object.keys(packageJson.dependencies);

const mathDependencies = dependencies.filter((v) =>
  v.startsWith('@galacticcouncil/math-')
);

// ESM bundle
esbuild
  .build({
    ...esmConfig,
    bundle: true,
    external: peerDependencies.concat(mathDependencies),
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
    external: peerDependencies.concat(mathDependencies),
  })
  .catch(() => process.exit(1));
