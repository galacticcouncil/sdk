# CLAUDE.md — Galactic SDK Monorepo

## Project Overview

Monorepo for [Hydration](https://hydration.net) chain integration SDKs. Built on [polkadot-api (papi)](https://papi.how/) — the modern Substrate SDK. All packages are published to npm under `@galacticcouncil/*`.

**License:** Apache 2.0

## Architecture

```
Your dApp
├── sdk-next          ← Trade routing, pool queries, smart order router
│   └── math-* (8)   ← WASM pool math (Rust-compiled, fetched from HydraDX-wasm repo)
├── xc                ← Cross-chain context factory (batteries-included)
│   ├── xc-sdk        ← Wallet interface for multi-platform transfers
│   ├── xc-cfg        ← Pre-built route configs, DEX integrations
│   └── xc-core       ← Core types, chain & asset definitions
├── xc-scan           ← Cross-chain transaction scanning
├── common            ← Shared utilities (substrate, EVM, XCM helpers)
└── descriptors       ← Hydration papi chain metadata descriptors
    └── polkadot-api  ← Substrate SDK (foundation)
```

## Dependency Graph (Build Order)

```
Level 0 (no internal deps):  common, descriptors, math-*, xc-scan
Level 1:                      sdk-next → common(peer), descriptors(peer), all math-*
                              xc-core  → common(peer), descriptors(peer)
Level 2:                      xc-sdk   → xc-core
                              xc-cfg   → xc-core, sdk-next(peer)
Level 3:                      xc       → xc-core(peer), xc-sdk(peer), xc-cfg(peer)
```

Turbo handles build ordering. `sdk-next` and `xc-core` explicitly depend on `common#postbuild` and `descriptors#postbuild` (see their local `turbo.json`).

## Tech Stack

| Concern           | Tool                                             |
|-------------------|--------------------------------------------------|
| Package manager   | npm (workspaces)                                 |
| Monorepo runner   | Turborepo                                        |
| Language          | TypeScript 5.7 (strict, ES2022 target)           |
| Bundler           | esbuild (dual ESM + CJS output)                  |
| Type declarations | `tsc --emitDeclarationOnly` (postbuild step)     |
| Test framework    | Jest + ts-jest (ESM mode)                        |
| Linting           | ESLint + Prettier                                |
| Releases          | Changesets (`@changesets/cli`)                   |
| CI                | GitHub Actions                                   |
| Node version      | 22+ (`.nvmrc`), README says 23+                  |

## Workspaces

```
packages/*             ← 16 published packages
examples/*             ← 3 example apps (not published)
integration-tests/*    ← xc-test (E2E with Chopsticks)
```

## Commands

### Development

```sh
npm ci                    # Install (use --ignore-scripts in CI)
npm run build             # Build all packages (turbo)
npm run build:watch       # Watch mode with hot reloading
npm run clean             # Remove all build/ dirs
npm run link              # npm link all packages for local dev
npm run test              # Run all tests (sequential, --concurrency=1)
```

### Per-Package Testing

```sh
cd packages/sdk-next && npm test
```

### Releasing

```sh
npm run changeset             # Create changeset (specify version bump + summary)
npm run changeset:version     # Apply version bumps, update lockfile, create commit
npm run release               # Build + publish to npm + push tags
```

Changesets config: public access, `origin/master` base branch, patch bumps for internal deps. Examples are excluded from publishing.

### Integration Tests (xc-test)

```sh
cd integration-tests/xc-test
npm run spec:calldata         # Call data verification
npm run spec:e2e              # E2E cross-chain transfers (needs Chopsticks)
```

## Build System Details

- **Output format:** Dual ESM (`build/index.mjs`) + CJS (`build/index.cjs`) for most packages; `xc-scan` is ESM-only.
- **Type declarations:** Emitted to `build/types/` via postbuild step.
- **External dependencies:** The `esbuild.plugin.mjs` externalizes all npm packages from bundles. `@thi.ng/*` namespaces are always kept external.
- **Math packages:** Not compiled locally — WASM binaries are fetched from `github.com/galacticcouncil/HydraDX-wasm` via `scripts/build-math.mjs`. Do not edit their `build/` contents.
- **Descriptors package:** Generated from papi whitelist (`papi whitelist`). The source is `src/whitelist.ts`; actual descriptors live in `.papi/descriptors/`.

## Testing

- **Framework:** Jest with ts-jest, ESM module support.
- **Test location:** Co-located with source as `*.spec.ts` files (excluded from build via tsconfig).
- **Test data:** `packages/sdk-next/test/data/` — pool fixtures (XYK, Omnipool, Stableswap, LBP).
- **Custom resolver:** `jest.resolver.cjs` maps local `@galacticcouncil/*` packages to `./src/index.ts` during tests so you don't need to build before testing.
- **Pattern:** Standard `describe`/`it`/`expect` with lightweight mock objects (e.g., `MockCtxProvider` in Router tests).
- **Tests run sequentially** (`--concurrency=1` at root) to avoid conflicts.

## Code Style

- Prettier: single quotes, trailing commas (es5), semicolons, arrow parens always.
- ESLint: extends `prettier` + `plugin:promise/recommended`.
- TypeScript: strict mode, ESNext modules, node module resolution.

## CI/CD

**`main.yml`** — runs on push/PR to master: install → build → test.
**`snapshot.yml`** — runs on PRs: builds snapshot release, publishes to npm with `beta` tag, creates draft upgrade PRs in `hydration-ui` repo.

## Key Files

| File | Purpose |
|------|---------|
| `turbo.json` | Task orchestration and caching |
| `esbuild.config.mjs` | Shared ESM/CJS build configs |
| `esbuild.plugin.mjs` | Package externalization plugin |
| `jest.config.mjs` | Root test configuration |
| `jest.resolver.cjs` | Maps local packages to source for tests |
| `scripts/build-math.mjs` | Fetches WASM math binaries from GitHub |
| `scripts/changeset-version.mjs` | Version bump + lockfile + commit |
| `.changeset/config.json` | Release configuration |
| `packages/*/turbo.json` | Per-package build dependency overrides |

## AI Agent Guidance

### Before Editing Any File

1. **Identify the package** the file belongs to and read its `package.json` for dependencies and scripts.
2. **Check for a local `turbo.json`** in that package — it may define additional build dependencies.
3. **Read the package's `esbuild.dist.mjs`** (or `esbuild.dev.mjs`) to understand its specific build setup.
4. **Check exports** — packages use `main`/`module`/`types` fields; some use the `exports` map. Ensure any new exports are registered.

### Tracing Code Across Packages

- `sdk-next` consumes `common`, `descriptors`, and all `math-*` packages. Pool implementations are in `packages/sdk-next/src/pool/`.
- The smart order router (`sor/`) builds a graph of pools and finds routes via BFS.
- Cross-chain flow: `xc` → `xc-cfg` (route configs) → `xc-sdk` (wallet/transfers) → `xc-core` (types/chains/assets).
- `common` utilities are used broadly — check downstream consumers before modifying.
- `descriptors` is generated — edit `src/whitelist.ts`, not the build output.

### Validating Changes

1. **Build the affected package:** `cd packages/<pkg> && npm run build`
2. **Build downstream:** `npm run build` (turbo will rebuild dependents)
3. **Run tests:** `npm run test` from root, or `npm run test` in a specific package
4. **Check types:** TypeScript declarations are emitted in postbuild — a successful build confirms type correctness.

### What NOT to Break

- **Do not edit `math-*` package contents** — they are fetched WASM binaries from an external repo. To update math, modify `scripts/build-math.mjs` or update the upstream HydraDX-wasm repo.
- **Do not edit files under `.papi/descriptors/`** — these are generated. Edit `packages/descriptors/src/whitelist.ts` and run `papi whitelist`.
- **Do not add `build/` to version control** — it's gitignored.
- **Preserve dual ESM/CJS output** — consumers rely on both formats. Don't remove CJS builds without understanding downstream impact.
- **Keep peer dependencies as peers** — `common`, `descriptors`, `polkadot-api`, and `viem` are intentionally peer deps to avoid version duplication.
- **The jest resolver maps 5 specific packages to source** (`common`, `sdk-next`, `xc-core`, `xc-cfg`, `xc-sdk`). If you add a new package that needs testing across boundaries, update `jest.resolver.cjs`.
- **`@thi.ng/*` packages are ESM-only** — the esbuild plugin keeps them external. Do not attempt to bundle them into CJS output.
- **Test files (`*.spec.ts`) are excluded from build** via tsconfig `exclude`. Keep them co-located with source, not in separate test directories.
