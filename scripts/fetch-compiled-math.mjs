import { mkdirSync, existsSync, appendFileSync } from 'fs';

const PARAM_PREFIX = '--';

const WASM_REPO = 'https://raw.githubusercontent.com/galacticcouncil/HydraDX-wasm';
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

const main = async () => {
  const args = process.argv.slice(2);
  const params = parseArgs(args);

  const mathParam = params['name'];

  if (!existsSync(BUILD_FOLDER)) {
    mkdirSync(BUILD_FOLDER, { recursive: true });
  }

  for (const conf of BUILD_MATRIX) {
    const [target, input, output] = conf;
    const file = await fetchResource(mathParam, target, input);
    const outPath = [BUILD_FOLDER, output];
    appendFileSync(outPath.join('/'), file);
    console.log(`${input} fetched`);
  }
  console.log(`Math ${mathParam} ready ✅`);
};

const parseArgs = (args) => {
  const parsedArgs = {};

  args.forEach((arg, i) => {
    if (arg.startsWith(PARAM_PREFIX)) {
      const key = arg.replace(PARAM_PREFIX, '');
      parsedArgs[key] = args[++i];
    }
  });
  return parsedArgs;
};

await main();
