import esbuild from 'esbuild';
import { wasmLoader } from 'esbuild-plugin-wasm';
import { esmConfig, cjsConfig, getPackageJson } from '../../esbuild.config.mjs';

const packageJson = getPackageJson(import.meta.url);

// ESM bundle
esbuild
  .build({
    ...esmConfig,
    bundle: true,
    plugins: [wasmLoader({ mode: 'embedded' })],
    external: Object.keys(packageJson.peerDependencies),
  })
  .catch(() => process.exit(1));

// Exclude maths from commonjs
const externalMaths = Object.keys(packageJson.dependencies).filter((v) =>
  v.startsWith('@galacticcouncil/math-')
);

// CJS bundle
esbuild
  .build({
    ...cjsConfig,
    bundle: true,
    external: Object.keys(packageJson.peerDependencies).concat(externalMaths),
  })
  .catch(() => process.exit(1));
