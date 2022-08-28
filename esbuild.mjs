import esbuild from "esbuild";
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "fs";
import { join } from "path";

const dist = join(process.cwd(), "dist");

if (!existsSync(dist)) {
  mkdirSync(dist);
}

const entryPoints = readdirSync(join(process.cwd(), "src"))
  .filter((file) => file.endsWith(".ts") && statSync(join(process.cwd(), "src", file)).isFile())
  .map((file) => `src/${file}`);

// ESM bundles with code splitting
esbuild
  .build({
    entryPoints,
    outdir: "dist/esm",
    bundle: true,
    sourcemap: true,
    minify: true,
    splitting: true,
    format: "esm",
    target: ["esnext"],
  })
  .catch(() => process.exit(1));

// CJS bundle
esbuild
  .build({
    entryPoints: ["src/index.ts"],
    outfile: "dist/cjs/index.cjs.js",
    bundle: true,
    sourcemap: true,
    minify: true,
    platform: "node",
    target: ["node18"],
  })
  .catch(() => process.exit(1));

// An entry file for CJS
writeFileSync(join(dist, "index.js"), "export * from './esm/index.js';");

// An entry file for ESM
writeFileSync(join(dist, "index.cjs.js"), "module.exports = require('./cjs/index.cjs.js');");
