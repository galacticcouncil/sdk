import esbuild from 'esbuild';
import { wasmLoader } from 'esbuild-plugin-wasm';
import { esmConfig, cjsConfig, getPackageJson } from '../../esbuild.config.mjs';

const packageJson = getPackageJson(import.meta.url);
const peerDependencies = Object.keys(packageJson.peerDependencies);
const dependencies = Object.keys(packageJson.dependencies);

const mathDependencies = dependencies.filter((v) =>
  v.startsWith('@galacticcouncil/math-')
);

// ESM bundle (Embedded wasms)
esbuild
  .build({
    ...esmConfig,
    bundle: true,
    plugins: [wasmLoader({ mode: 'embedded' })],
    external: peerDependencies,
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
