import esbuild from 'esbuild';
import { wasmLoader } from 'esbuild-plugin-wasm';
import { writeFileSync } from 'fs';
import { esmConfig, cjsConfig, getPackageJson } from '../../esbuild.config.mjs';

const packageJson = getPackageJson(import.meta.url);
const peerDependencies = Object.keys(packageJson.peerDependencies);
const dependencies = Object.keys(packageJson.dependencies);

const mathDependencies = dependencies.filter((v) =>
  v.startsWith('@galacticcouncil/math-')
);

// ESM bundle (Deferred wasms)
esbuild
  .build({
    ...esmConfig,
    bundle: true,
    plugins: [wasmLoader({ mode: 'deferred' })],
    external: peerDependencies,
  })
  .then(({ metafile }) => {
    writeFileSync('build-meta.json', JSON.stringify(metafile));
  })
  .catch(() => process.exit(1));

// CJS bundle (External math modules)
esbuild
  .build({
    ...cjsConfig,
    bundle: true,
    external: peerDependencies.concat(mathDependencies),
  })
  .catch(() => process.exit(1));
