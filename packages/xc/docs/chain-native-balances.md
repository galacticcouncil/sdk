# Spec: Chain-native Balance Reads (Phase 3)

## Background

Phases 1 & 2 made the **chain** the source of truth for *which* builder reads an asset's
balance/min:

- Phase 1 added a balance/min registry to [`Chain`](../../xc-core/src/chain/Chain.ts) —
  `getBalanceBuilder(asset)` / `getMinBuilder()`.
- Phase 2 deleted the balance/min builders from route templates; every read site now resolves
  its builder from the chain registry.

But a builder only produces a **query config** (`SubstrateQueryConfig | ContractConfig |
SolanaQueryConfig | SuiQueryConfig`). Turning that config into an `AssetAmount` — the actual
node query — still lives in `xc-sdk` under
[`PlatformAdapter`](../../xc-sdk/src/platforms/adapter.ts) and the per-platform `Platform`
classes ([`SubstratePlatform`](../../xc-sdk/src/platforms/substrate/SubstratePlatform.ts),
[`EvmPlatform`](../../xc-sdk/src/platforms/evm/EvmPlatform.ts), Solana, Sui) plus their
`*/balance/` factories.

Consequence: **you cannot read a balance without `xc-sdk` and a transfer context.**
`DataProcessor.getBalance` ([DataProcessor.ts:34](../../xc-sdk/src/transfer/DataProcessor.ts#L34))
formats the account, builds the config from the registry, then calls
`adapter.getBalance(asset, config)`. Other SDKs (e.g. `xc-swap`, which today reads no on-chain
balances) can't reuse any of this without pulling in the whole wallet/transfer machinery.

### Key enabling fact

**Every runtime client already lives in `xc-core`.** The `xc-sdk` balance glue is thin and its
*only* dependency is `xc-core`:

| Platform | Client (already in `xc-core`) | Balance reader (in `xc-sdk`, to move) |
|---|---|---|
| Substrate | `Parachain.client` (papi `PolkadotClient`) | inline in `SubstratePlatform.subscribeBalance` |
| EVM | `EvmChain.evmClient` (`EvmClient`, `Erc20Client`) | `evm/balance/*` (`Native`, `Erc20`, factory) |
| Solana | `SolanaChain.connection` (`@solana/web3.js`) | `solana/balance/*` (`Native`, `Token`, factory) |
| Sui | `SuiChain.client` (`@mysten/sui`) | `sui/balance/*` (`Native`, factory) |

The balance factories ([EvmBalanceFactory](../../xc-sdk/src/platforms/evm/balance/EvmBalanceFactory.ts),
Solana, Sui) take a config + a client, both already xc-core types. The config types
(`ContractConfig`, `SubstrateQueryConfig`, `SolanaQueryConfig`, `SuiQueryConfig`) are already
exported from `xc-core`. So moving the read execution into `xc-core` adds **no new heavy
dependencies** — the clients and config types are already there.

## Goal

- A chain can fetch any asset's balance on its own:
  ```ts
  const amount: AssetAmount = await chain.getBalance(asset, address);
  ```
  No `Wallet`, no `ConfigService`, no route, no `PlatformAdapter`.
- **Reactive and composite** reads ship in the same phase: a per-asset
  `chain.subscribeBalance(asset, address)` stream and a multi-asset
  `chain.subscribeBalances(assets, address)` stream that merges them. Merging observables is the
  whole point — it is the only clean way to compose a multi-token (and ultimately multi-chain)
  balance feed, which is the end-game for reusable composite features in `xc-swap` and UIs.
- The chain becomes a **unified read surface**: it already owns asset metadata (decimals, ids,
  min, xcmLocation) and the builder registry; Phase 3 adds the *execution* so balance (and the
  balance-shaped reads — dynamic `min`, existential deposit) are first-class chain methods.
- `xc-swap` and any future SDK depend only on `xc-core` to read balances.
- `xc-sdk`'s `PlatformAdapter` and `DataProcessor` delegate to the chain rather than owning the
  read.

## Non-goals

- **No change to transfer execution.** `buildCall`, `estimateFee`, and the `*/transfer/*`
  factories stay in `xc-sdk` `Platform` classes — those are transfer concerns, not reads.
- No change to the balance/min **builder/registry** API from Phases 1–2.
- No change to `AssetAmount`, asset metadata, or XCM location declarations.
- No change to signer/claim flows.

## Why "at most 3 token types per chain" makes this small

The executor surface per platform is tiny and fixed — it is the same handful of storage shapes
the registry already selects between:

- **Substrate**: `system.account`, `tokens.accounts`, `assets.account`, `foreignAssets.account`
  (all read through one papi query path keyed by `module`/`func`/`args` + a `transform`).
- **EVM**: `Native`, `Erc20` (2).
- **Solana**: `Native`, `Token` (2).
- **Sui**: `Native` (1).

A balance read is fully described by the query config's `module`/`func`; the executor is a
small dispatch over those — exactly what the existing factories already do.

## Design

### 1. `xc-core` — relocate the balance-read execution

Move the read-only execution into `xc-core` (e.g. `packages/xc-core/src/balance/`), keyed by the
config's platform discriminator (`BaseConfig.type`, a `CallType`):

```
xc-core/src/balance/
  substrate.ts   // papi query: client.getUnsafeApi().query[module][func] + config.transform + normalize
  evm.ts         // EvmBalanceFactory → Native | Erc20  (moved from xc-sdk)
  solana.ts      // SolanaBalanceFactory → Native | Token
  sui.ts         // SuiBalanceFactory → Native
  read.ts        // readBalance(chain, config, asset): dispatch by config.type
```

`read.ts` is the balance-only analogue of today's `PlatformAdapter`, but it lives in `xc-core`,
takes the chain (for its client) + the built config, and returns an `AssetAmount`. It does **not**
do transfers/fees.

```ts
// xc-core/src/balance/read.ts
export async function readBalance(
  chain: AnyChain,
  config: BaseConfig,
  asset: Asset
): Promise<AssetAmount> {
  switch (config.type) {
    case CallType.Substrate: return readSubstrate(chain as AnyParachain, config, asset);
    case CallType.Evm:       return readEvm((chain as AnyEvmChain).evmClient, config, asset);
    case CallType.Solana:    return readSolana((chain as SolanaChain).connection, config, asset);
    case CallType.Sui:       return readSui((chain as SuiChain).client, config, asset);
  }
}
```

`read.ts` exposes a `subscribeBalance(chain, config, asset): Observable<AssetAmount>` twin over the
same per-platform readers (§4); `readBalance` is just its one-shot form.

> Dispatch is by **`config.type`, not chain type** — this is what lets `EvmParachain` (which has
> both a substrate and an evm client) read `tokens.accounts` *or* an erc20 precompile depending on
> which builder the registry returned, exactly as `PlatformAdapter` does today.

### 2. `xc-core` — `Chain.getBalance`

```ts
// Chain.ts (base) — shared orchestration; execution via readBalance()
async getBalance(asset: Asset, address: string): Promise<AssetAmount> {
  const account = await this.resolveBalanceAccount(asset, address);
  const config = this.getBalanceBuilder(asset).build({ address: account, asset, chain: this });
  return readBalance(this, config, asset);
}
```

`resolveBalanceAccount` folds in the h160-derivation that `DataProcessor.getBalance` does today
([DataProcessor.ts:40-43](../../xc-sdk/src/transfer/DataProcessor.ts#L40-L43)):

```ts
protected async resolveBalanceAccount(asset: Asset, address: string): Promise<string> {
  const assetId = this.getBalanceAssetId(asset);
  return EvmAddr.isValid(assetId.toString()) && this.isEvmParachain()
    ? (this as unknown as EvmParachain).getDerivatedAddress(address)
    : address;
}
```

Everything it needs (`getBalanceAssetId`, `getDerivatedAddress`) is already on the chain.

### 3. `xc-core` — fold in the balance-shaped reads

`min` (dynamic) and existential deposit are the same query path and already use `chain.client` +
a registry builder, so they come along naturally and complete the "self-sufficient chain":

```ts
async getMin(asset: Asset): Promise<AssetAmount>             // getMinBuilder()?.build(...) → readBalance, else static getAssetMin
async getExistentialDeposit(): Promise<AssetAmount | undefined>  // Parachain only (moves from SubstrateService)
```

This subsumes `DataDestinationProcessor.getMin/getEd` and `DataProcessor.getMin` execution.

### 4. Reactive reads — `subscribeBalance` + composite streams (in this phase)

**Decision:** `rxjs` becomes an `xc-core` peer dependency and reactive reads ship together with
`getBalance` in Phase 3. It is already a de-facto dependency across the stack, and merging
observables is exactly what makes multi-token / multi-chain composite features possible — that
composability is the goal, not a follow-up.

**Per-asset stream** — the body of
[`SubstratePlatform.subscribeBalance`](../../xc-sdk/src/platforms/substrate/SubstratePlatform.ts#L122-L150)
(and the EVM/Solana/Sui equivalents) moved verbatim into the readers from §1:

```ts
subscribeBalance(asset: Asset, address: string): Observable<AssetAmount>
```
- Substrate: papi `watchValue(...args, { at: 'best' })` → `config.transform` → normalize.
- EVM: `watchBlocks` → re-read; Solana/Sui: poll/watch → re-read.

**Composite multi-asset stream** — subsumes today's
[`Wallet.subscribeBalance`](../../xc-sdk/src/Wallet.ts#L266) (which already does exactly this over
a chain's unique routes):

```ts
subscribeBalances(assets: Asset[], address: string): Observable<AssetAmount[]> {
  return combineLatest(assets.map((a) => this.subscribeBalance(a, address)))
    .pipe(debounceTime(500));
}
```
On Substrate this is N `watchValue` subscriptions merged into one stream — the "multiple tokens"
case directly. Because the unit is a plain `Observable`, higher layers compose freely with no new
chain API — e.g. a cross-chain portfolio is just another merge:

```ts
combineLatest([
  hydration.subscribeBalances(hydrationAssets, addr),
  assethub.subscribeBalances(hubAssets, addr),
]).pipe(map((sets) => sets.flat()));
```

**`getBalance` reuses this path**, matching today's behaviour exactly (no new query path to
validate): `getBalance = firstValueFrom(subscribeBalance(asset, address))` for Substrate — which
is literally what [`SubstratePlatform.getBalance`](../../xc-sdk/src/platforms/substrate/SubstratePlatform.ts#L114-L120)
does today — and the existing direct one-shot read for EVM/Solana/Sui. Folding `rxjs` in removes
the only reason to special-case the one-shot path, so divergence risk drops to ~zero.

### 5. `xc-sdk` — delegate, then thin out

- [`DataProcessor.getBalance`](../../xc-sdk/src/transfer/DataProcessor.ts#L34) →
  `return chain.getBalance(asset, address)` (account-format + build + execute now live on the
  chain). `getMin`/`getEd` likewise delegate. The processors keep only fee/transact
  orchestration.
- [`DataDestinationProcessor`](../../xc-sdk/src/transfer/DataDestinationProcessor.ts) collapses to
  thin wrappers over `chain.getBalance/getMin/getEd` (or is dropped, callers using the chain
  directly).
- [`PlatformAdapter.getBalance`/`subscribeBalance`](../../xc-sdk/src/platforms/adapter.ts#L95-L104)
  → delegate to the chain. `buildCall`/`estimateFee` stay.
- [`Wallet.subscribeBalance`](../../xc-sdk/src/Wallet.ts#L266) → `chainRoutes.chain.subscribeBalance(asset, address)` per unique asset.
- The `*/balance/` folders move out of `xc-sdk/src/platforms/*` into `xc-core/src/balance/`.

### 6. `xc-swap` (and other SDKs) — the payoff

```ts
import { chainsMap } from '@galacticcouncil/xc-cfg';
const hydration = chainsMap.get('hydration')!;
const usdc = /* asset */;
const balance = await hydration.getBalance(usdc, address); // no wallet, no routes
```

`xc-swap` adds `@galacticcouncil/xc-core` (already a peer in the graph) and gains balance reads
without `xc-sdk`.

## Migration impact

| Consumer | Required change |
|---|---|
| `xc-core` `Chain` (+ subclasses) | New `getBalance`, `subscribeBalance`, `subscribeBalances`, `getMin`, `getExistentialDeposit`. Host the moved `balance/` readers. |
| `xc-core` deps | Add `rxjs` peer dep (reactive reads ship this phase). Clients + `@solana/web3.js` + `@mysten/sui` are already imported by chain files — no other new deps. |
| `xc-sdk` `DataProcessor` / `DataDestinationProcessor` | `getBalance`/`getMin`/`getEd` delegate to the chain; processors shrink. |
| `xc-sdk` `PlatformAdapter` | `getBalance`/`subscribeBalance` delegate to chain; `*/balance/` folders removed. |
| `xc-sdk` `Wallet.subscribeBalance` | Calls `chain.subscribeBalance`. |
| `hydration-ui` & external consumers | None (additive). New `chain.getBalance` available. |
| `xc-swap` | Add `xc-core` dep; call `chain.getBalance`. |

Breaking only if `PlatformAdapter`'s public balance methods change signature — keep them as
delegating shims to avoid that. Net: **MINOR** on `xc-core`, `xc-sdk` (new API + internal
rewire); `xc-swap` MINOR (new capability). Add a changeset per package.

## Risks & mitigations

- **Behavior divergence in the moved readers.** Mitigation: the readers are moved *verbatim*
  (same factories, same papi query, same `normalizeAssetAmount`/decimals fallback). Guard with a
  parity test: for representative assets per platform, `chain.getBalance` must equal today's
  `PlatformAdapter` result.
- **Substrate one-shot vs watch.** Switching `getBalance` from `watchValue`+`firstValueFrom` to
  `getValue` must read the same storage at `best`. Verify against a live/Chopsticks node.
- **`normalizeAssetAmount` decimals/symbol.** Moves to `xc-core`; preserve the
  `getAssetDecimals(asset) ?? chain currency` fallback and ED/symbol handling.
- **EvmParachain dual-client dispatch.** Covered by dispatching on `config.type`, not chain type.

## Acceptance

- `chain.getBalance(asset, address)` returns an `AssetAmount` **numerically identical** to the
  current `PlatformAdapter` path for representative assets on each platform: substrate
  `system`/`tokens`/`assets`/`foreignAssets`, evm `native`/`erc20`, solana `native`/`token`, sui
  `native`.
- A standalone script (no `Wallet`/`ConfigService`/route) reads a balance from a chain built from
  `chainsMap`, and `chain.subscribeBalances([...], addr)` emits a merged `AssetAmount[]` that
  updates per block — including a substrate chain with assets in different pallets
  (`system` + `tokens` + `assets`).
- `xc-sdk` transfer flows (`getTransferData`) and `Wallet.subscribeBalance` behave unchanged —
  balance numbers, emission cadence and validation identical to baseline (the composite stream is
  the moved `Wallet.subscribeBalance` logic).
- `xc-swap` imports `xc-core` and reads a balance.
- `npm run build` + `npm run test` green; changeset per affected package.

## Open questions

1. **Method home.** `getBalance` on the base `Chain` (shared orchestration + `readBalance`
   dispatch) vs. an abstract `readBalance` per subclass. Recommendation: base-class
   orchestration + a `readBalance` dispatcher (handles `EvmParachain`'s dual client cleanly).
2. ~~Ship `subscribeBalance` now or later?~~ **Resolved:** ships in Phase 3; `rxjs` accepted as
   an `xc-core` peer dep. Per-asset + composite (`subscribeBalances`) streams land together so
   multi-token / multi-chain composition is available from day one.
3. **Keep `PlatformAdapter.getBalance` as a shim** (non-breaking) or remove it and migrate callers
   in the same release? Recommendation: keep as a thin delegating shim this release; deprecate.
4. **`@solana/web3.js` / `@mysten/sui` as explicit `xc-core` deps.** They're imported by chain
   files today (via the wormhole SDKs); when the readers move, make them direct deps for clarity.
