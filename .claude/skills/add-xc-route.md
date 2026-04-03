# Add a Cross-Chain Route

## When to Use

Adding support for transferring an asset on a new cross-chain path in the `xc-cfg` package.

## Inspect First

- `packages/xc-cfg/src/configs/` — existing route configurations per chain
- `packages/xc-core/src/chain/` — chain definitions (`Chain.ts`, `Parachain.ts`, `EvmParachain.ts`, `EvmChain.ts`)
- `packages/xc-core/src/asset/Asset.ts` — asset definition types
- `packages/xc-core/src/config/definition/AssetRoute.ts` — route structure
- `packages/xc-core/src/config/definition/ChainRoutes.ts` — how routes are grouped by chain
- `packages/xc-cfg/src/index.ts` — what maps are exported (`assetsMap`, `chainsMap`, `routesMap`)

## Workflow

1. **Define the chain** (if new): Add chain definition in `xc-cfg` using types from `xc-core` (`Parachain`, `EvmParachain`, `EvmChain`, `SolanaChain`, `SuiChain`).

2. **Define the asset** (if new): Create asset entry with correct `key`, `originSymbol`, and decimals.

3. **Create the route config**: Define `AssetRoute` specifying source chain, destination chain, asset, and the extrinsic/contract config builders that handle the transfer.

4. **Register in maps**: Ensure the new chain/asset/route is included in the exported `chainsMap`, `assetsMap`, and `routesMap`.

5. **Add builders if needed**: Check `packages/xc-cfg/src/builders/` for existing extrinsic and contract builders. Reuse existing builders (e.g., `PolkadotXcm`, `XTokens`, `Wormhole`) when possible.

## Validation

```sh
cd packages/xc-cfg && npm test    # Runs jest --silent, checks address spaces and builder outputs
npm run build                     # Build all — xc depends on xc-cfg#postbuild
```

## Cautions

- `xc-cfg` depends on `xc-core` for types and `sdk-next` as a peer dep for DEX integrations. Don't import directly from `sdk-next` internals — use the peer dep interface.
- Chain address validation tests in `src/chains/chains.spec.ts` verify H160/SS58 address space compatibility. Adding a chain likely requires adding it to those tests.
- `xc-cfg` test runs with `--silent` flag — errors may be suppressed. Check exit code, not just output.
