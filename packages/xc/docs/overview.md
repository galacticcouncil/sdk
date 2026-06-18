# XC — architecture context (`galacticcouncil/sdk`)

Reasoning map of the [`galacticcouncil/sdk`](https://github.com/galacticcouncil/sdk) monorepo —
the layering, core abstractions, and where things live — so an agent can navigate it without
re-scanning. Portable into the sdk repo as `CLAUDE.md`-style context.

The monorepo holds **two** stacks that share `common`/`descriptors` but otherwise don't depend on
each other:

1. **Trading** — `sdk-next`: quote & route swaps **on Hydration** (Omnipool/stableswap/xyk/…).
2. **Cross-chain (XC)** — `xc-core` → `xc-cfg` → `xc-sdk`/`xc`: move assets **between chains**.

```
common, descriptors        (shared: helpers/evm/xcm, papi metadata)
        │
        ├── sdk-next                 trade engine (Hydration DEX)
        │
        └── xc-core ─ xc-cfg ─┬─ xc-sdk      cross-chain transfer stack
                              ├─ xc          batteries-included factory
                              └─ xc-scan     cross-chain tx scanning
```

`xc-core` = types/engine (no data). `xc-cfg` = concrete chain/asset/route **data** + builders.
`xc-sdk` = execution (wallet). `xc` = one-call factory wiring cfg + dexes.

## Stack

Three abstractions, deliberately separated:

- **`Asset`** (`xc-core/asset/Asset.ts`) — identity only: `{ key, originSymbol }`. **No chain id.**
  The same `weth` Asset exists on every chain.
- **`Chain`** (`xc-core/chain/Chain.ts` + `EvmChain`/`Parachain`/`EvmParachain`/`SolanaChain`/
  `SuiChain`) — where an Asset _has_ an id. Holds `assetsData: Map<assetKey, AssetData>` with
  `AssetData = { asset, id, balanceId?, decimals?, min?, xcmLocation? }`. `id` is a **`ChainAssetId`**
  (`string | number | bigint | nested`): **EVM chains store the ERC20 address; parachains store the
  numeric asset id.** Lookups: `getAsset(key)`, `getAssetId(asset)`, `getAssetDecimals(asset)`.
- **`AssetRoute`** (`xc-core/config/definition/AssetRoute.ts`) — how an Asset moves source→dest:
  `{ source, destination, contract?, extrinsic?, fee, move?, program?, transact?, tags }`. Routes are
  grouped per chain in **`ChainRoutes`**.

These compose in **`ConfigService`** (`xc-core/config/ConfigService.ts`): registries
`assets/chains/routes` + query methods — `getAsset`, `getChain`, `getChainRoutes`, `getAssetRoutes`,
`getSourceChains`, `getDestinationChains`. **`ConfigBuilder(service)`** is the fluent query over it.
This is the "asset-config based on routes": you query the registry rather than maintain your own map.

### Config builders (the route DSL)

`xc-core/config/definition/*` is a builder family, one per execution mechanism — each produces a
config object a route references:

| Builder                            | Produces                                     |
| ---------------------------------- | -------------------------------------------- |
| `contract/ContractConfigBuilder`   | EVM contract call (uses `xc-core/evm/abi/*`) |
| `extrinsic/ExtrinsicConfigBuilder` | substrate extrinsic                          |
| `fee/FeeAmount`+`FeeAsset`         | fee sizing / fee asset                       |
| `move/MoveConfigBuilder`           | the actual cross-chain move (xcm / bridge)   |
| `program/ProgramConfigBuilder`     | Solana program call                          |
| `balance/`, `min/`                 | balance query id, min amounts                |

`xc-cfg/builders/` implements the concrete ones — notably `contracts/Wormhole/TokenBridge.ts`,
`contracts/Basejump.ts`, `contracts/snowbridge/`, and `extrinsics/xcm/*` (the XCM message builders,
incl. `buildParaERC20Received`, MRL helpers).

## xc-core layout

```
asset/      Asset, AssetAmount
chain/      Chain (+ Evm/Parachain/EvmParachain/Solana/Sui), chain/dex/ (DEX registry types)
config/     ConfigService, ConfigBuilder, definition/* (route + builder DSL above)
evm/        EvmClient, Erc20Client, EvmResolver, precompile, abi/* (TokenBridge, Basejump, Gmp,
            PolkadotXcm, Snowbridge, Weth, Erc20, Batch, Meta) ← canonical EVM ABIs for the stack
bridge/     basejump, snowbridge, wormhole  (bridge-kind definitions)
utils/      mrl, multilocation, codec, address
```

## xc-cfg layout (the data)

```
assets.ts   Asset instances (lowercase keys: weth, eth, dot, glmr, hdx, wbtc, …)
chains/     chain instances w/ assetsData, by ecosystem: evm/{mainnet,base}, polkadot/{hydration,
            moonbeam,assethub,…}, kusama/, solana/, sui/.  Named exports: `ethereum`, `hydration`, …
configs/    per-chain route configs + templates.ts (configs/<eco>/<chain>/{index,templates}.ts).
            HydrationConfigService = pre-wired ConfigService for Hydration as hub.
builders/   concrete ContractBuilder/ExtrinsicBuilder + contracts/* + extrinsics/xcm/*
dex/, resolvers/ (hydration), clients/, validations/, tags.ts
```

Top-level exports: `chainsMap`, `assetsMap`, `routesMap`, `HydrationConfigService`, plus
`builders`, `clients`, `dex`, `tags` namespaces, and named chains (`ethereum`, `hydration`, …).

**Asset-id resolution pattern** (EVM address ↔ Hydration id) goes through chains: find the `ethereum`
`assetsData` entry whose `id` matches the address → its `asset` → `hydration.getAssetId(asset)`.
EVM `id` is a string (address); parachain `id` is numeric — branch on `typeof`.

## xc-sdk / xc

- `xc-sdk` — execution layer. `Wallet.ts` (multi-platform transfer interface), `transfer/`
  (`DataProcessor`/`DataOriginProcessor`/`DataReverseProcessor` — assemble transfer data from routes),
  `platforms/` (per-ecosystem signing/submit), `FeeSwap.ts`.
- `xc` — `factory.ts` builds a batteries-included context (`registerDexes(config, opts)` + cfg);
  use when you don't want to wire `ConfigService` + dexes by hand.
- `xc-scan` — query/store/client for indexing cross-chain transfers.

## Navigation cheatsheet

| Need                          | Look in                                                                 |
| ----------------------------- | ----------------------------------------------------------------------- | ----------- |
| Asset id on a chain           | `xc-cfg` chain (`getAssetId`), data in `chains/<eco>/<chain>.ts`        |
| EVM ABI for a bridge contract | `xc-core/evm/abi/*` (TokenBridge, Basejump, Gmp, …)                     |
| How an asset bridges X→Y      | `xc-cfg/configs/<eco>/<chain>/` route + `builders/contracts             | extrinsics` |
| Cross-chain registry/query    | `xc-core/config/ConfigService` + `ConfigBuilder`                        |
| Execute a transfer            | `xc-sdk/Wallet` + `transfer/`                                           |
| XCM message construction      | `xc-cfg/builders/extrinsics/xcm/*`, `xc-core/utils/{mrl,multilocation}` |

## Conventions / gotchas

- `Asset` carries no id — always resolve through a `Chain` (`getAssetId`).
- `ChainAssetId` is polymorphic (EVM address string vs parachain numeric) — branch on `typeof`.
- Multiple representations of "the same" token coexist as distinct Assets/ids (e.g. Hydration `weth`
  Wormhole-route `1000189` vs `eth` Snowbridge `34`) — pick the one matching the route the value
  travels; don't assume one WETH.
- Data (`xc-cfg`) is separate from engine (`xc-core`) — new chains/assets/routes are data edits.
- sdk-next and the xc stack are independent; only `common`/`descriptors` are shared.
