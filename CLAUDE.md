# CLAUDE.md — Galactic SDK Monorepo

## Protocol context

For Hydration protocol-level context (architecture, products, tokenomics, Omnipool mechanics), fetch the central context index via WebFetch:
`https://raw.githubusercontent.com/galacticcouncil/hydration/main/CLAUDE.md`

It lists available reference documents and their raw GitHub URLs.

## Project overview

Monorepo for [Hydration](https://hydration.net) chain integration SDKs. Built on [polkadot-api (papi)](https://papi.how/) — the modern Substrate SDK. All packages are published to npm under `@galacticcouncil/*`.

**Repo:** `galacticcouncil/sdk`
**License:** Apache 2.0
**Toolchain:** TypeScript 5.7 (strict, ES2022), Node 22+ (`.nvmrc`)

## Build & test

```sh
npm ci                    # Install (use --ignore-scripts in CI)
npm run build             # Build all packages (turbo)
npm run build:watch       # Watch mode with hot reloading
npm run clean             # Remove all build/ dirs
npm run link              # npm link all packages for local dev
npm run test              # Run all tests (sequential, --concurrency=1)
```

Single package test: `cd packages/sdk-next && npm test`

Integration tests (xc-test):

```sh
cd integration-tests/xc-test
npm run spec:calldata         # Call data verification
npm run spec:e2e              # E2E cross-chain transfers (needs Chopsticks)
```

## Code style

- Prettier: single quotes, trailing commas (es5), semicolons, arrow parens always.
- ESLint: extends `prettier` + `plugin:promise/recommended`.
- TypeScript: strict mode, ESNext modules, node module resolution.

## Commit & PR conventions

Commit messages use `scope: description` format — lowercase, imperative, no period:

```
sdk: fix native mint cfg
xc: support solana native mint & claim
desc: update to latest metadata
```

Common scopes: `sdk`, `xc`, `desc`, `common`, `scan`. Omit scope for multi-package or repo-wide changes.

Automated release commits follow: `RELEASE: Releasing N package(s)`

**Branches:** `feat/description` or `fix/description`

## Versioning

**SemVer** on all packages — managed via [Changesets](https://github.com/changesets/changesets):

```sh
npm run changeset             # Create changeset (specify version bump + summary)
npm run changeset:version     # Apply version bumps, update lockfile, create commit
npm run release               # Build + publish to npm + push tags
```

- MAJOR — breaking API changes
- MINOR — new features
- PATCH — bug fixes

Changesets config: public access, `origin/master` base branch, patch bumps for internal deps. Examples and `sdk-next-cjs`/`sdk-next-esm`/`xc-transfer` are excluded from publishing.

## Project structure

```
packages/                 # 16 published packages
  sdk-next/               # Trade routing, pool queries, smart order router
  math-*/                 # 8 WASM pool math packages (fetched from HydraDX-wasm)
  xc/                     # Cross-chain context factory (batteries-included)
  xc-sdk/                 # Wallet interface for multi-platform transfers
  xc-cfg/                 # Pre-built route configs, DEX integrations
  xc-core/                # Core types, chain & asset definitions
  xc-scan/                # Cross-chain transaction scanning
  common/                 # Shared utilities (substrate, EVM, XCM helpers)
  descriptors/            # Hydration papi chain metadata descriptors
examples/                 # 3 example apps (not published)
integration-tests/        # xc-test (E2E with Chopsticks)
scripts/                  # Build helpers (math fetcher, changeset version)
```

### Dependency graph (build order)

```
Level 0 (no internal deps):  common, descriptors, math-*, xc-scan
Level 1:                      sdk-next → common(peer), descriptors(peer), all math-*
                              xc-core  → common(peer), descriptors(peer)
Level 2:                      xc-sdk   → xc-core
                              xc-cfg   → xc-core, sdk-next(peer)
Level 3:                      xc       → xc-core(peer), xc-sdk(peer), xc-cfg(peer)
```

Turbo handles build ordering. `sdk-next` and `xc-core` explicitly depend on `common#postbuild` and `descriptors#postbuild` (see their local `turbo.json`).

## Key patterns

- **Dual ESM/CJS output:** Most packages emit `build/index.mjs` + `build/index.cjs`; `xc-scan` is ESM-only.
- **Type declarations:** Emitted to `build/types/` via postbuild step (`tsc --emitDeclarationOnly`).
- **External dependencies:** `esbuild.plugin.mjs` externalizes all npm packages. `@thi.ng/*` namespaces are always kept external (ESM-only).
- **Math packages:** Not compiled locally — WASM binaries are fetched from `github.com/galacticcouncil/HydraDX-wasm` via `scripts/build-math.mjs`. Do not edit their `build/` contents.
- **Descriptors package:** Generated from papi whitelist (`papi whitelist`). The source is `src/whitelist.ts`; actual descriptors live in `.papi/descriptors/`.
- **Peer dependencies:** `common`, `descriptors`, `polkadot-api`, and `viem` are intentionally peers to avoid version duplication.

## Testing guidelines

- **Framework:** Jest with ts-jest, ESM module support.
- **Test location:** Co-located with source as `*.spec.ts` files (excluded from build via tsconfig).
- **Test data:** `packages/sdk-next/test/data/` — pool fixtures (XYK, Omnipool, Stableswap, LBP).
- **Custom resolver:** `jest.resolver.cjs` maps local `@galacticcouncil/*` packages to `./src/index.ts` during tests so you don't need to build before testing.
- **Pattern:** Standard `describe`/`it`/`expect` with lightweight mock objects (e.g., `MockCtxProvider` in Router tests).
- **Tests run sequentially** (`--concurrency=1` at root) to avoid conflicts.

## Dependencies

| Concern           | Tool                                             |
|-------------------|--------------------------------------------------|
| Package manager   | npm (workspaces)                                 |
| Monorepo runner   | Turborepo                                        |
| Language          | TypeScript 5.7 (strict, ES2022 target)           |
| Bundler           | esbuild (dual ESM + CJS output)                  |
| Test framework    | Jest + ts-jest (ESM mode)                        |
| Linting           | ESLint + Prettier                                |
| Releases          | Changesets (`@changesets/cli`)                   |
| CI                | GitHub Actions                                   |

## CI checks

**`main.yml`** — runs on push/PR to master: install → build → test.
**`snapshot.yml`** — runs on PRs: builds snapshot release, publishes to npm with `beta` tag, creates draft upgrade PRs in `hydration-ui` repo.

## Key files

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

## AI agent guidance

### Before editing any file

1. **Identify the package** the file belongs to and read its `package.json` for dependencies and scripts.
2. **Check for a local `turbo.json`** in that package — it may define additional build dependencies.
3. **Read the package's `esbuild.dist.mjs`** (or `esbuild.dev.mjs`) to understand its specific build setup.
4. **Check exports** — packages use `main`/`module`/`types` fields; some use the `exports` map. Ensure any new exports are registered.

### Tracing code across packages

- `sdk-next` consumes `common`, `descriptors`, and all `math-*` packages. Pool implementations are in `packages/sdk-next/src/pool/`.
- The smart order router (`sor/`) builds a graph of pools and finds routes via BFS.
- Cross-chain flow: `xc` → `xc-cfg` (route configs) → `xc-sdk` (wallet/transfers) → `xc-core` (types/chains/assets).
- `common` utilities are used broadly — check downstream consumers before modifying.
- `descriptors` is generated — edit `src/whitelist.ts`, not the build output.

### Validating changes

1. **Build the affected package:** `cd packages/<pkg> && npm run build`
2. **Build downstream:** `npm run build` (turbo will rebuild dependents)
3. **Run tests:** `npm run test` from root, or `npm run test` in a specific package
4. **Check types:** TypeScript declarations are emitted in postbuild — a successful build confirms type correctness.

### What NOT to break

- **Do not edit `math-*` package contents** — they are fetched WASM binaries from an external repo. To update math, modify `scripts/build-math.mjs` or update the upstream HydraDX-wasm repo.
- **Do not edit files under `.papi/descriptors/`** — these are generated. Edit `packages/descriptors/src/whitelist.ts` and run `papi whitelist`.
- **Do not add `build/` to version control** — it's gitignored.
- **Preserve dual ESM/CJS output** — consumers rely on both formats. Don't remove CJS builds without understanding downstream impact.
- **Keep peer dependencies as peers** — `common`, `descriptors`, `polkadot-api`, and `viem` are intentionally peer deps to avoid version duplication.
- **The jest resolver maps 5 specific packages to source** (`common`, `sdk-next`, `xc-core`, `xc-cfg`, `xc-sdk`). If you add a new package that needs testing across boundaries, update `jest.resolver.cjs`.
- **`@thi.ng/*` packages are ESM-only** — the esbuild plugin keeps them external. Do not attempt to bundle them into CJS output.
- **Test files (`*.spec.ts`) are excluded from build** via tsconfig `exclude`. Keep them co-located with source, not in separate test directories.
