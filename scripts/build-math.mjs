import { existsSync, mkdirSync, writeFileSync } from 'fs';

import { parseArgs } from './common.mjs';

const GITHUB_API =
  'https://api.github.com/repos/galacticcouncil/HydraDX-wasm/git/trees/main?recursive=1';
const WASM_REPO =
  'https://raw.githubusercontent.com/galacticcouncil/HydraDX-wasm';
const WASM_BRANCH = 'main';
const WASM_BUILD = 'build';

// Build matrix [origin-target, origin-file, out]
const BUILD_MATRIX = [
  ['bundler', 'hydra_dx_wasm.js', 'index.mjs'],
  ['bundler', 'hydra_dx_wasm.d.ts', 'index.d.ts'],
  ['bundler', 'hydra_dx_wasm_bg.js', 'hydra_dx_wasm_bg.js'],
  ['bundler', 'hydra_dx_wasm_bg.wasm', 'hydra_dx_wasm_bg.wasm'],
  ['bundler', 'hydra_dx_wasm_bg.wasm.d.ts', 'hydra_dx_wasm_bg.wasm.d.ts'],
  ['nodejs', 'hydra_dx_wasm.js', 'index.cjs'],
];
const BUILD_FOLDER = 'build';

const fetchResource = async (math, target, file) => {
  const path = [WASM_REPO, WASM_BRANCH, WASM_BUILD, math, target, file];
  const resp = await fetch(path.join('/'));
  const arrayBuffer = await resp.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

const fetchTree = async () => {
  const resp = await fetch(GITHUB_API);
  const json = await resp.json();
  return json.tree;
};

const main = async () => {
  const args = process.argv.slice(2);
  const params = parseArgs(args);

  const mathParam = params['name'];

  if (!existsSync(BUILD_FOLDER)) {
    mkdirSync(BUILD_FOLDER, { recursive: true });
  }

  const gitTree = await fetchTree();

  for (const conf of BUILD_MATRIX) {
    const [target, input, output] = conf;

    const confPath = [BUILD_FOLDER, mathParam, target, input].join('/');
    const confItem = gitTree.find((record) => record.path === confPath);
    const confSha = confItem.sha;
    const file = await fetchResource(mathParam, target, input);
    const outPath = [BUILD_FOLDER, output];
    writeFileSync(outPath.join('/'), file);
    console.log(`${input} [${confSha.slice(0, 8)}] fetched`);
  }
  console.log(`Math ${mathParam} ready ✅`);
};

await main();
