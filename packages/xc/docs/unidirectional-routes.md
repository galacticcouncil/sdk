# Spec: Unidirectional Route Resolution

## Background

Today every transfer the SDK resolves produces a `TransferConfigs` pair:

```ts
// packages/xc-core/src/config/types.ts
export interface TransferConfigs {
  origin: TransferConfig;   // source -> destination
  reverse: TransferConfig;  // destination -> source (must exist)
}
```

The `reverse` half is built by [ConfigBuilder.ts:80-92](packages/xc-core/src/config/ConfigBuilder.ts#L80-L92) via
`config.getAssetRoutes(assetToReceive, destination, source)`. Two things rely on it:

1. **Existence check (implicit)** — `ConfigBuilder.build()` throws (inside `getAssetDestinationRoutes`) when no
   reverse route exists, so every `(asset, src, dst)` triple in the SDK is forced to be round-trippable.
2. **Destination chain data** — [Wallet.ts:127-152](packages/xc-sdk/src/Wallet.ts#L127-L152) feeds the reverse
   `TransferConfig` into [DataReverseProcessor](packages/xc-sdk/src/transfer/DataReverseProcessor.ts) to query:
   - `dst.getBalance(dstAddress)` — receiver's balance of the received asset on dest chain
   - `dst.getMin()` — chain-specific min for the received asset on dest chain
   - `dst.getEd()` — existential deposit on dest chain
   Those values back the `destination.balance` / `destination.fee` fields of the [Transfer DTO](packages/xc-sdk/src/types.ts#L41-L44)
   and the send-minimum computation via [calculateMin](packages/xc-sdk/src/transfer/utils.ts#L48-L74).

This design blocks one-way transfers — chains/assets where outflow exists but no inflow back to source is configured.

Observation: the dest-side `balance` and `min` builders are really **chain+asset facts**, not direction-of-transfer
facts. They describe storage shape on a chain. Today they happen to be stored on the reverse route's `source` block
because the framework leans on bidirectional symmetry. Once we want one-way routes, that hiding place breaks.

## Goals

- Allow registering an origin route without requiring a reverse route to exist.
- Surface `reversible` flag to consumers so the UI can hide the "swap direction" affordance.
- Continue to compute the destination-side data needed for the Transfer DTO (`balance`, `min`, `ed`) even when no
  reverse route exists.
- Move balance/min builders to their natural home — the chain — so the system stops relying on reverse-route symmetry.
- Eventually remove all source-side balance/min builders from `AssetRoute` so route templates carry only direction-
  and bridge-specific data.

## Phases

Two-step rollout. Each phase ships independently behind its own release.

| | Phase 1 — chain registry & one-way routes | Phase 2 — route simplification |
|---|---|---|
| Goal | Unblock one-way transfers. | Strip redundant balance/min from routes. |
| Touches | `xc-core`, `xc-sdk`, and `xc-cfg/chains/*` (chain definitions). | `xc-core` route types, `xc-sdk` processors, **all** `xc-cfg` route templates. |
| Routes | Untouched. | Heavily edited — balance/min builders removed. |
| Risk | Low (additive). | Medium (mechanical but wide blast radius). |

## Non-goals

- No change to `subscribeBalance` API shape ([Wallet.ts:254](packages/xc-sdk/src/Wallet.ts#L254)) — internal rewiring only.
- No change to `ChainRoutes` keying / lookup semantics for forward routes.
- No change to how `Asset`, chain `assetsData`, or XCM location metadata is declared.

## Phase 1 — chain registry & one-way routes

### 1. `xc-core` — chain-level balance/min registry

Extend the **base** [`Chain<T>`](packages/xc-core/src/chain/Chain.ts) class with a **default + overrides** registry.
Every subclass (Parachain, EvmParachain, EvmChain, SolanaChain, SuiChain) inherits the field set and accessors for
free. The chain becomes the source of truth for "how do I read balance / min for an asset on this chain".

```ts
// packages/xc-core/src/chain/Chain.ts
export interface ChainParams<T extends ChainAssetData> {
  // ...existing fields
  balance: BalanceConfigBuilder;
  balanceOverrides?: Record<string /* asset.key */, BalanceConfigBuilder>;
  min?: MinConfigBuilder;
}

export abstract class Chain<T extends ChainAssetData> {
  // ...existing fields
  readonly balance: BalanceConfigBuilder;
  readonly balanceOverrides?: Record<string, BalanceConfigBuilder>;
  readonly min?: MinConfigBuilder;

  // ...existing constructor assigns the three new fields

  getBalanceBuilder(asset: Asset): BalanceConfigBuilder {
    return this.balanceOverrides?.[asset.key] ?? this.balance;
  }

  getMinBuilder(): MinConfigBuilder | undefined {
    return this.min;
  }
}
```

Subclasses (`Parachain`, `EvmParachain`, etc.) require no changes beyond forwarding the new params through `super(...)`.

**Why default + overrides for `balance`:** matches reality. Most assets on a chain share one balance storage map
(e.g. Hydration uses `tokens.accounts` for nearly everything, with `system.account` only for native HDX). Per-asset
declarations would be pure repetition; a dispatch function loses declarativity. Default + override stays terse.

**Why `min` is one-per-chain, no overrides:** per-asset min variance is already covered by two mechanisms.

- **Static path** — `assetsData[*].min: number` ([Chain.ts:46-52](packages/xc-core/src/chain/Chain.ts#L46-L52))
  gives a declarative per-asset value on the chain definition; `chain.getAssetMin(asset)` returns it.
  `DataDestinationProcessor.getMin()` falls back to this when no `MinConfigBuilder` is set.
- **Dynamic path** — `chain.min: MinConfigBuilder` describes the **storage shape only** (e.g. "read from
  `assets.asset` on AssetHub"). The builder is shared across all assets on the chain; per-asset variance is
  injected at query time via `chain.getMinAssetId(asset)` which plugs in the right asset ID.

Every AssetHub route in `xc-cfg` today uses the same `AssetMinBuilder().assets().asset()` — confirming that one
builder per chain suffices in practice.

**Why `min` is optional:** chains where the minimum is a static value (already captured by `assetsData[*].min` in
chain definitions) don't need a builder at all — the static fallback covers them. The `min` builder is only
needed for chains with **dynamic** min storage (AssetHub-style).

### 2. `xc-core` — `TransferConfigs` shape

[packages/xc-core/src/config/types.ts](packages/xc-core/src/config/types.ts)

```diff
 export interface TransferConfigs {
   origin: TransferConfig;
-  reverse: TransferConfig;
+  // True when a route in the opposite direction exists in the config service.
+  reversible: boolean;
 }
```

That's the whole change. No `DestinationConfig` — the destination chain and asset already sit on
`origin.route.destination.{chain,asset}`, and balance/min are pulled from the chain registry at the read site
(see §4). The reverse-route block was the only thing that previously needed its own slot.

### 3. `xc-core` — `ConfigBuilder.build`

[packages/xc-core/src/config/ConfigBuilder.ts:57-109](packages/xc-core/src/config/ConfigBuilder.ts#L57-L109)

- Stop throwing when no reverse route exists — add a `getAssetDestinationRoutesOrEmpty` variant on
  `ConfigService` (or guard the existing call) to avoid exceptions for control flow.
- Compute `reversible = reverseRoutes.length > 0`.
- Drop the `reverse: { chain, route }` field from the returned object; emit `reversible` instead.

That's it for the builder — no destination resolution needed; the chain registry covers the read side directly.

### 4. `xc-sdk` — destination-side processor

[packages/xc-sdk/src/transfer/DataReverseProcessor.ts](packages/xc-sdk/src/transfer/DataReverseProcessor.ts)

Replace `DataReverseProcessor` (which took a full `TransferConfig`) with a thinner `DataDestinationProcessor`
that takes just the destination chain and the received asset, and reads balance/min builders from the chain registry:

```ts
export class DataDestinationProcessor {
  constructor(
    readonly adapter: PlatformAdapter,
    readonly chain: AnyChain,
    readonly asset: Asset,
  ) {}

  async getEd(): Promise<AssetAmount | undefined>          // chain-level only
  async getBalance(address: string): Promise<AssetAmount>  // chain.getBalanceBuilder(asset).build(...)
  async getMin(): Promise<AssetAmount>                     // chain.getMinBuilder(asset)?.build(...) else static getAssetMin
}
```

The current `DataProcessor` base assumes a `TransferConfig` with a full `route.source` — that's no longer true on
the dest side. Cleanest split: keep `DataProcessor` as the origin's base and make `DataDestinationProcessor` a
sibling. Shared helpers (`getDecimals`, `formatEvmAddress` wiring) move to a `utils` module.

### 5. `xc-sdk` — `Wallet.getTransferData`

[packages/xc-sdk/src/Wallet.ts:121-252](packages/xc-sdk/src/Wallet.ts#L121-L252)

```diff
-const srcConf = configs.origin;
-const dstConf = configs.reverse;
-
-const srcAdapter = new PlatformAdapter(srcConf.chain);
-const dstAdapter = new PlatformAdapter(dstConf.chain);
-
-const src = new DataOriginProcessor(srcAdapter, srcConf);
-const dst = new DataReverseProcessor(dstAdapter, dstConf);
+const srcConf = configs.origin;
+const { chain: dstChain, asset: dstAsset } = srcConf.route.destination;
+
+const srcAdapter = new PlatformAdapter(srcConf.chain);
+const dstAdapter = new PlatformAdapter(dstChain);
+
+const src = new DataOriginProcessor(srcAdapter, srcConf);
+const dst = new DataDestinationProcessor(dstAdapter, dstChain, dstAsset);
```

Rest of `getTransferData` stays — `dst.getBalance / getMin / getEd` keep the same signatures, and
`ctx.destination.chain` becomes `dstChain`.

### 6. `xc-sdk` — surface `reversible` on the Transfer DTO

[packages/xc-sdk/src/types.ts](packages/xc-sdk/src/types.ts)

```diff
 export interface Transfer {
   source: TransferSourceData;
   destination: TransferDestinationData;
+  // True if a return-trip route is registered. Consumers may use this to
+  // gate UI affordances (swap-direction button, etc.). Does not imply any
+  // guarantee about that reverse route's runtime availability.
+  reversible: boolean;
   buildCall(amount): Promise<Call>;
   estimateFee(amount): Promise<AssetAmount>;
   validate(fee?): Promise<TransferValidationReport[]>;
 }
```

Populated in `Wallet.getTransferData` from `configs.reversible`.

### 7. `xc-cfg` — fill in chain registries

For every chain in [packages/xc-cfg/src/chains/](packages/xc-cfg/src/chains/), add `balance` (and optional
`balanceOverrides`, `min`, `minOverrides`) to the constructor call.

Existing route declarations are untouched. Source the values by skimming current route templates for each chain
(the dominant `BalanceBuilder()` pattern becomes the chain default; outliers become overrides).

**Example — Hydration:**

```ts
new EvmParachain({
  // ...existing fields
  balance: BalanceBuilder().substrate().tokens().accounts(),
  balanceOverrides: {
    [hdx.key]: BalanceBuilder().substrate().system().account(),
  },
  // min stays undefined — Hydration uses static min values from assetsData
});
```

**Example — Polkadot AssetHub** (dynamic min via `assets.asset()`):

```ts
new Parachain({
  // ...existing fields
  balance: BalanceBuilder().substrate().assets().account(),
  balanceOverrides: {
    [dot.key]: BalanceBuilder().substrate().system().account(),
  },
  min: AssetMinBuilder().assets().asset(),
});
```

Chains where the registry is incomplete continue to work for any bidirectional route (route-level builders win).
The registry only becomes load-bearing when a one-way route is first introduced for that chain+asset pair.

## Phase 2 — remove source-side balance builders from routes

**Pre-requisite:** phase 1 has shipped and every chain's registry covers every asset used in any route from/to
that chain. A pre-flight validation (added in phase 1, see §8 below) gates this.

### What goes away from `AssetRoute`

All balance/min builders sitting on the **source side** of a route move to the chain registry. The route stops
describing storage shape entirely — it only describes the transfer itself.

```diff
 interface SourceConfig {
   asset: Asset;
-  balance: BalanceConfigBuilder;
-  destinationFee: {
-    asset?: Asset;
-    balance: BalanceConfigBuilder;
-  };
+  destinationFee?: Asset;
   fee?: FeeConfig;
-  min?: MinConfigBuilder;
 }

 interface FeeConfig {
   asset: Asset | FeeAssetConfigBuilder;
-  balance: BalanceConfigBuilder;
   extra?: number;
   swap?: boolean;
 }

 interface TransactFeeConfig {
   amount: number;
   asset: Asset;
-  balance: BalanceConfigBuilder;
 }
```

`source.destinationFee` collapses from a struct (`{ asset?, balance }`) to a flat optional `Asset` — the fee-asset
override. Read sites that did `source.destinationFee.asset || destination.fee.asset` become
`source.destinationFee ?? destination.fee.asset`.

### Read-site rewiring (`xc-sdk`)

Every consumer of `source.*.balance` / `source.min` switches to chain-registry lookups against the chain that
owns the read:

| Read site | Today | After phase 2 |
|---|---|---|
| [DataProcessor.getBalance](packages/xc-sdk/src/transfer/DataProcessor.ts#L34-L51) | `route.source.balance.build(...)` | `chain.getBalanceBuilder(asset).build(...)` |
| [DataProcessor.getMin](packages/xc-sdk/src/transfer/DataProcessor.ts#L53-L69) | `route.source.min.build(...)` | `chain.getMinBuilder(asset)?.build(...)` (with static `getAssetMin` fallback) |
| [DataOriginProcessor.getFeeBalance](packages/xc-sdk/src/transfer/DataOriginProcessor.ts#L119-L139) | `source.fee.balance.build(...)` | `chain.getBalanceBuilder(feeAsset).build(...)` |
| [DataOriginProcessor.getDestinationFeeBalance](packages/xc-sdk/src/transfer/DataOriginProcessor.ts#L74-L95) | `source.destinationFee.balance.build(...)` | `chain.getBalanceBuilder(feeAsset).build(...)` |
| [DataOriginProcessor.getTransactFeeBalance](packages/xc-sdk/src/transfer/DataOriginProcessor.ts#L289-L301) | `cfg.fee.balance.build(...)` | `cfg.chain.getBalanceBuilder(fee.asset).build(...)` |
| [Wallet.subscribeBalance](packages/xc-sdk/src/Wallet.ts#L254-L280) | `source.balance.build(...)` per route | `chainRoutes.chain.getBalanceBuilder(asset).build(...)` per unique asset |

`DataDestinationProcessor` (added in phase 1) already pulls from chain registry — no change.

### `ConfigBuilder.build`

Lookup order collapses to "**chain registry only**" — route-level fallback is deleted along with the route fields.

### `xc-cfg` route templates

Mechanical purge across:
- [packages/xc-cfg/src/configs/](packages/xc-cfg/src/configs/) — every `new AssetRoute({...})` and template
  function. Drop `source.balance`, `source.min`, `source.fee.balance`, `source.destinationFee.balance`,
  `transact.fee.balance`.

Before / after for a typical route:

```diff
 new AssetRoute({
   source: {
     asset: ewt,
-    balance: balance(),
     fee: fee(),
-    destinationFee: {
-      balance: balance(),
-    },
   },
   destination: {
     chain: energywebx,
     asset: ewt,
     fee: { amount: 0.02, asset: ewt },
   },
   extrinsic: ExtrinsicBuilder().polkadotXcm().limitedReserveTransferAssets(),
 });
```

A route with a fee-asset override (e.g. bridge cases like [evm/ethereum/index.ts:49-51](packages/xc-cfg/src/configs/evm/ethereum/index.ts#L49-L51)):

```diff
 source: {
   asset: assetIn,
-  balance: BalanceBuilder().evm().erc20(),
-  destinationFee: {
-    asset: eth,
-    balance: BalanceBuilder().evm().native(),
-  },
+  destinationFee: eth,
 },
```

Typical route declarations shrink by ~30-40% of their lines.

### Risk & mitigations

- **Missing registry entry causes runtime breakage.** Mitigation: phase 1's validation step (§8) errors at
  `ConfigService` construction if a route references an asset/chain combination the registry doesn't cover. This
  is enabled by default before phase 2 lands.
- **Subtle behavior divergence.** Phase 1 logs a warning when `route.source.balance` exists but doesn't match
  `chain.getBalanceBuilder(asset)` — gives us a release cycle to spot misregistered chains before phase 2 deletes
  the route-level fallback.

### 8. `xc-core` — registry validation (added in phase 1, hard-fails in phase 2)

`ConfigService` constructor walks every route and asserts that:
- For each `(route.source.asset, chain)`, `chain.getBalanceBuilder(asset)` returns a builder.
- For each fee asset referenced (`source.fee.asset`, `source.destinationFee.asset`,
  `destination.fee.asset` where read on source), source chain registry covers it.

Phase 1: warning. Phase 2: throws.

## Migration impact

### Phase 1

| Consumer | Required change |
|---|---|
| `xc-core` chain classes | Accept new `balance` / `balanceOverrides` / `min` / `minOverrides` constructor params + expose accessors. `balance` is **required** to keep type safety. |
| `xc-cfg` chain definitions | Add `balance` (mandatory) and optional override maps. Mechanical — value lifted from existing route templates for that chain. |
| `xc-cfg` route declarations | None. |
| `hydration-ui` (and other external `TransferConfigs` consumers) | Drop reads of `configs.reverse.*`. Dest chain/asset come from `configs.origin.route.destination`. New `reversible` flag available. |
| `examples/xc-transfer` | No code change; uses `TransferBuilder.build()` which already hides `TransferConfigs`. |
| `integration-tests/xc-test` | Audit any direct `configs.reverse` reads — likely none. |

### Phase 2

| Consumer | Required change |
|---|---|
| `xc-core` route types | `SourceConfig`, `FeeConfig`, `TransactFeeConfig` lose their `balance` fields; `SourceConfig` loses `min`. |
| `xc-sdk` processors | Read-site rewiring per the table in §Phase 2. |
| `xc-cfg` route templates | Mechanical purge of `source.balance` / `source.min` / `source.fee.balance` / `source.destinationFee.balance` / `transact.fee.balance` across every route definition. |
| `xc-cfg` route builders | `BalanceBuilder()` imports inside route templates are dropped where they only fed source-side balance. |
| `hydration-ui` | None (route shape changes don't leak through `TransferBuilder`). |

Breaking changes per phase → **MINOR** bump on `xc-core`, `xc-cfg`, `xc-sdk` (pre-1.0 semver convention in this repo treats
minor as breaking). Add a changeset per package per phase.

## Open questions

1. **`balance` required vs optional on chain params.** Required gives type-level guarantee that the registry is
   populated; optional softens the migration. Recommendation: **required** — every chain in `xc-cfg` has a
   canonical balance storage map, so making it mandatory both forces correctness and gives the type system useful
   power. Tradeoff: every `xc-cfg` chain file gets touched in this PR.
2. **Should `reversible` be richer?** E.g. `reverseTags: string[]` so UI can also know *how* it would be reversed.
   Recommendation: keep boolean for now; promote to a richer shape only when a consumer asks.
3. **Phase 2 timing.** When do we cut the phase 2 release? Recommendation: after phase 1 has shipped, one-way
   routes have been exercised in `hydration-ui` for one release cycle, and the registry-validation warning has
   been silent across all chains for a full release.

## Acceptance

- `npm run test` green (Jest, sequential).
- `examples/xc-transfer/src/index.ts` runs end-to-end for an existing bidirectional pair (e.g. eth↔hydration) and
  the resulting `Transfer` has `reversible === true` with **unchanged numeric values** vs. baseline (chain registry
  must match what the previous reverse-route lookup would have yielded — guarded by the validation in §8).
- A synthetic one-way route (forward declared, no reverse) resolves without throwing and yields
  `reversible === false`. `DataDestinationProcessor.getBalance` succeeds via `chain.getBalanceBuilder(asset)`.
- Removing the chain registry entry for an asset used in a one-way route causes `ConfigService` construction to
  warn in phase 1 (and throw in phase 2) — exercised as a negative test.
- Changeset added per affected package; types compile under `tsc --noEmit` across the workspace.
