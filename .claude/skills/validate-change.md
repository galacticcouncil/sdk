# Validate a Monorepo Change

## When to Use

After modifying code in any package. Use this checklist to confirm the change is safe before committing.

## Determine Affected Scope

| You changed... | Also affected |
|----------------|---------------|
| `common` | sdk-next, xc-core (and everything above them) |
| `descriptors/src/whitelist.ts` | descriptors build, then sdk-next, xc-core |
| `sdk-next` | xc-cfg (peer dep) |
| `xc-core` | xc-sdk, xc-cfg, xc |
| `xc-cfg` | xc |
| `xc-sdk` | xc |
| `math-*` | Do not edit — these are fetched WASM binaries |
| Root build configs (`esbuild.config.mjs`, `esbuild.plugin.mjs`) | All packages using esbuild |
| `jest.resolver.cjs` | All test suites |

## Steps

### 1. Type-check the affected package

```sh
cd packages/<pkg> && npx tsc --noEmit
```

### 2. Build the full graph

```sh
npm run build
```

Turbo caches unchanged packages — only affected packages rebuild. If build fails, check the turbo dependency chain (packages with local `turbo.json` files: sdk-next, xc-core, xc-cfg, xc).

### 3. Run tests

Only 4 packages have tests: `common`, `sdk-next`, `xc-core`, `xc-cfg`.

```sh
npm run test
```

Or target just the affected package:

```sh
cd packages/<pkg> && npm test
```

### 4. If you changed exports

Verify the barrel in `src/index.ts` re-exports the new code. Check `main`/`module`/`types` fields in `package.json` still point to correct build outputs.

## Quick Reference: Packages Without Tests

These packages have no `test` script — validate via build + type-check only:
`descriptors`, `xc`, `xc-sdk`, `xc-scan`, all `math-*`
