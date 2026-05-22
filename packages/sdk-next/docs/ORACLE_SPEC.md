# Oracle - Protocol Spec

> **Package:** `sdk-next` | **Date:** 2026-05-17
> **Scope:** Hydration runtime's `EmaOracle` pallet (substrate) and the
> Chainlink-compatible MM oracles referenced from `Stableswap.PoolPegs`
> (EVM); the bridge between the two via the 20-byte
> substrate-asset reference.

---

## 0. Overview

Hydration runs **two independent** oracle systems with separate update paths.
They live on different sides of the runtime (substrate vs EVM); the only
connection is that the EVM-side `Hybrid` aggregator (and the
`*OracleAdapter` helpers used by Aave) read EMA prices on demand through a
precompile.

```
   substrate side                                       EVM side
   ─────────────────────────────                        ──────────────────────────────────
   pallet-stableswap ┐                                  Managed-oracle keeper ┐
   pallet-omnipool   ├─ trades ────┐                    DIA OracleUpdate pub. ┤
   pallet-xyk        ┘             │                                          │
                                   ▼                                          ▼
   Bifrost relay keeper ─ extrinsic ─►  ┌────────────┐        ┌──────────────────────────┐
                                        │ EMA oracle │        │  MM oracle layer (EVM)   │
                                        │ (Part 1)   │        │   Managed | DIA wrapper  │
                                        │            │        │           | Hybrid       │
                                        └─┬──▲───────┘        └────────┬─────────────────┘
                                          │  │                         │
                                          │  │  precompile read        │  IAggregatorV3
                                          │  │  (Hybrid + adapters)    │  .latestRoundData()
                                          │  └─────────────────────────┤
                                          ▼                            ▼
              ┌─────────────────────────────────┐         ┌─────────────────────────────┐
              │ substrate consumers             │         │ EVM consumers               │
              │  pallet-omnipool (circuit-      │         │ (Aave price oracle,         │
              │   breaker, withdraw limits)     │         │  Stableswap PoolPegs        │
              │  pallet-stableswap (pegs, fees) │         │  evaluator, integrators)    │
              │  pallet-dca (slippage)          │         └─────────────────────────────┘
              │  router, …                      │
              └─────────────────────────────────┘
```

> The trade-producing pallets (`stableswap` / `omnipool` / `xyk`) are also
> EMA *consumers* — they push trades in and read prices back out for things
> like dynamic fees, circuit-breaker bounds, and peg evaluation. The diagram
> separates the two roles for clarity but it's the same pallets on both
> sides.

- **EMA oracle** is fed entirely from substrate producers. Every DEX trade
  on `stableswap` / `omnipool` / `xyk` appends to `Accumulator` (folded into
  `Oracles` at `on_finalize`). A separate Bifrost-relay keeper writes a
  "bifrosto"-tagged feed via `EmaOracle.update_bifrost_oracle` for assets
  that don't trade locally (currently only `vDOT`). The pallet emits **no**
  per-update events.
- **MM oracle** is fed entirely from EVM producers. `Managed` is
  keeper-pushed and emits `PriceUpdated`; `DIA wrapper` forwards reads to a
  separately-fed DIA contract (`OracleUpdate` event on the DIA side). The
  **Hybrid aggregator** is the only kind that reaches into EMA — it reads
  one leg through a precompile and emits nothing itself.
- **Substrate consumers** of EMA (omnipool circuit breakers, stableswap peg
  evaluator, DCA slippage checks, router pricing) read directly via runtime
  storage. **EVM consumers** read MM oracles via `IAggregatorV3.latestRoundData()`;
  the MM kind only matters when you need to detect *when* the value changed
  (§2.6).

The bridge between the two layers is the **20-byte substrate-asset
reference** (§2.5) — an H160 that, instead of pointing at a real EVM
contract, encodes `(period, source, pair)` for an `EmaOracle.Oracles`
lookup.

---

# Part 1 — EMA Oracle (substrate)

## 1.1 Pallet & storage

```
pallet:        EmaOracle
storage:       Oracles
type:          NMap (3 keys → value)
```

### 1.1.1 Key

```ts
type EmaOracleKey = [
  source: Bytes<8>,                         // 8-byte source tag (ASCII, null-padded)
  pair:   [u32, u32],                       // sorted (smaller asset id first)
  period: OraclePeriod
];
```

### 1.1.2 Value

```ts
type EmaOracleValue = [
  entry: {
    price:     { n: bigint; d: bigint };    // rational n/d
    volume:    { a_in: bigint; b_out: bigint; a_out: bigint; b_in: bigint };
    liquidity: { a: bigint; b: bigint };
    shares_issuance?: bigint;
    updated_at: u32;                        // block number of last refresh
  },
  init_block: u32                           // block when the slot was first written
];
```

`liquidity` and `volume` are non-zero only for AMM-derived EMAs. For
relayed sources (e.g. `bifrosto`) the keeper writes price-only updates and
those fields stay at zero.

## 1.2 Sources

Each source is an 8-byte ASCII tag. The runtime's trade pallets push their
trades under a fixed tag; the Bifrost relay path uses its own.

| Hex                         | ASCII      | Origin                                                                                 |
| ---                         | ---        | ---                                                                                    |
| `0x73 74 61 62 6c 65 73 77` | `stablesw` | Hydration stableswap pool trades (EMA of pool spot price)                              |
| `0x6f 6d 6e 69 70 6f 6f 6c` | `omnipool` | Omnipool trades (EMA of Omnipool spot price; one side is `LRNA`)                       |
| `0x78 79 6b 00 00 00 00 00` | `xyk`      | XYK AMM trades                                                                         |
| `0x62 69 66 72 6f 73 74 6f` | `bifrosto` | Bifrost-relayed price; populated via `EmaOracle.update_bifrost_oracle` extrinsic       |
| `0x00 00 00 00 00 00 00 00` | (zeros)    | Generic "native" placeholder when one side of the pair is the native asset (`HDX = 0`) |

> Substrate's `Source` is a fixed-size `[u8; 8]`. Shorter ASCII names are
> right-padded with `\0`. Always pass the full 8 bytes when querying.

## 1.3 Periods

Maps 1:1 to the `pallet_ema_oracle::OraclePeriod` enum:

| Index | Variant       | Persisted on Hydration?       |
| :-:   | ---           | :-:                           |
| `0`   | `LastBlock`   | ✅                            |
| `1`   | `Short`       | ✅                            |
| `2`   | `TenMinutes`  | ✅                            |
| `3`   | `Hour`        | ❌ enum-defined, no storage   |
| `4`   | `Day`         | ❌                            |
| `5`   | `Week`        | ❌                            |

Only `LastBlock`, `Short`, and `TenMinutes` are written by the runtime's
configured `SupportedPeriods`. Querying any other variant returns `None`.

## 1.4 Update mechanism

Two distinct producers populate `EmaOracle.Oracles`:

### 1.4.1 DEX-driven (automatic)

When a trade executes on `stableswap`, `omnipool`, or `xyk`, the pallet
appends a `(source, pair, entry)` record into `Accumulator` for that block.
At `on_finalize`, `Accumulator` is folded into `Oracles` — the running
EMAs for all supported periods are advanced and persisted. `updated_at` on
the `entry` is set to the current block.

No explicit pallet event fires for these writes. The only signal is the
storage diff on the affected `Oracles` keys per block.

### 1.4.2 Bifrost-relayed (extrinsic)

A keeper invokes:

```rust
EmaOracle::update_bifrost_oracle(
  origin,
  asset_a: u32, asset_b: u32, price: (n, d)
);
```

…which writes the same `(price)` into all three persisted periods under
source `bifrosto`. The `n/d` values per period drift apart slightly over
time because each period's accumulator runs its own EMA math, but the
underlying price the keeper pushed is identical.

> The set of pallet-level *events* is limited to:
> `AddedToWhitelist`, `RemovedFromWhitelist`, `OracleUpdated`.
> `OracleUpdated` only fires on whitelist changes — **not** on every
> `Oracles` write. Don't try to subscribe to it as a price-change signal.

## 1.5 Reading via papi

```ts
import { Binary } from 'polkadot-api';

// One specific (source, pair, period):
const result = await api.query.EmaOracle.Oracles.getValue(
  Binary.fromHex('0x626966726f73746f'),          // source: "bifrosto"
  [5, 15],                                        // pair: (DOT, vDOT)
  { type: 'LastBlock', value: undefined }
);

// All populated periods for a (source, pair):
const all = await api.query.EmaOracle.Oracles.getEntries(
  Binary.fromHex('0x626966726f73746f'),
  [5, 15]
);

// Full sweep — useful for discovery
const everything = await api.query.EmaOracle.Oracles.getEntries();
```

## 1.6 Watching for updates

The pallet does not emit a per-update event, so you have three options:

1. **`state_subscribeStorage`** against the canonical storage key (§1.7) —
   fires on every block where the slot changes.
2. **Block subscription + storage read** — read `EmaOracle.Oracles` at each
   finalized block; cheap because the value is small. This is what the
   `indexer` module supports out of the box.
3. **Extrinsic watch** — for the `bifrosto` source specifically, you can
   filter mempool / finalized extrinsics for `EmaOracle.update_bifrost_oracle`
   calls. This tells you who pushed and the exact `(asset_a, asset_b, price)`
   the keeper sent.

## 1.7 Full storage key (worked example)

For `(source="bifrosto", pair=(5,15), period=Short)`:

```
0x5258a12472693b34a3ed25509781e55f     ← twox128("EmaOracle")
  b791503346263b9999698b7159c0d857     ← twox128("Oracles")
  c7e860d98b04912c                     ← twox64(source bytes)
  626966726f73746f                     ← raw source bytes
  91ce5cf6356a9a45                     ← twox64(pair bytes)
  0500000010000000                     ← raw pair bytes (LE u32: 5, 16)
  30e7211b8127418a                     ← twox64(period scale encoding)
  01                                   ← raw period byte (Short=1)
```

The pallet uses `Twox64Concat` for each n-map key segment, which is why each
segment is `hash(key) ++ raw(key)`. Don't hand-roll this — use
`api.query.EmaOracle.Oracles.getKey(...)`.

---

# Part 2 — MM Oracle (EVM)

## 2.1 Overview & kinds

An **MM oracle** is the price source referenced by a Hydration `Stableswap`
pool peg whose `source.type === 'MMOracle'`. The `value` is a 20-byte H160
that, despite living in EVM-address space, may be one of three distinct
kinds. All three expose `IAggregatorV3.latestRoundData()` so EVM consumers
treat them uniformly — the kind only matters when you need to detect *when*
the value changed.

### Managed

- **At the H160:** `ManagedOracle` — Chainlink-compatible aggregator
  pushed by an off-chain keeper.
- **Update signal:** `PriceUpdated(uint80,int256,uint256)` event emitted by
  the address itself on every keeper push.
- **Detection:** direct emitter match — scan blocks for `PriceUpdated` with
  `emitter == mmAddress`.

### DIA wrapper

- **At the H160:** thin Chainlink-facade contract that forwards reads to a
  DIA oracle via `getValue(key)`.
- **Update signal:** `OracleUpdate(string,uint128,uint128)` on the
  *underlying* DIA contract — the wrapper itself emits **nothing**.
- **Detection:** scan for `OracleUpdate` events; for each unmapped
  `mmAddress`, call `latestRoundData()` and match its `(answer, updatedAt)`
  against the DIA event's `(value, timestamp)`.

### Hybrid aggregator

- **At the H160:** contract that composes a Managed feed × a substrate-asset
  price (via the EMA oracle, §1) — `answer = compose(managed, ema)`,
  `updatedAt = max(managed.updatedAt, ema.updatedAt)`.
- **Update signal:** none — emits **no event at all**.
- **Detection:** call `latestRoundData()` at tip; cross-reference its
  `updatedAt` to a Managed `PriceUpdated` cache from pass 1, or watch the
  EMA storage directly (§1.6) for substrate-side moves.

## 2.2 ManagedOracle ABI

```solidity
event PriceUpdated(uint80 indexed roundId, int256 answer, uint256 timestamp);

function latestRoundData() external view returns (
  uint80 roundId,
  int256 answer,
  uint256 startedAt,
  uint256 updatedAt,
  uint80 answeredInRound
);

function decimals() external view returns (uint8);
function description() external view returns (string);
function version() external view returns (uint256);
```

Topic hash (used by event-based discovery, computed at runtime via
`viem.toEventHash`):

```
PriceUpdated(uint80,int256,uint256)
```

## 2.3 DIA wrapper

```solidity
event OracleUpdate(string key, uint128 value, uint128 timestamp);   // on the DIA contract

function getValue(string key) external view returns (uint128 value, uint128 timestamp);
```

The wrapper sitting at the `mmAddress` exposes `latestRoundData()` but
internally calls `getValue(key)` against a fixed DIA contract. Its `answer`
and `updatedAt` always agree with the latest emitted `OracleUpdate` for the
configured `key`.

Topic hash:

```
OracleUpdate(string,uint128,uint128)
```

## 2.4 Hybrid aggregator

```solidity
constructor(address assetToXOracle_, address XToUsdOracle_);

function latestRoundData() external view returns (
  uint80, int256 answer, uint256, uint256 updatedAt, uint80
);
```

`answer = compose(assetToX, XToUsd)`; `updatedAt = max(assetToX.updatedAt, XToUsd.updatedAt)`.
The contract emits **no** events of its own.

One leg is typically a regular `ManagedOracle` address (EVM). The other leg
may be an **encoded substrate-asset reference** (§2.5) — that leg never
emits any EVM log; its updates happen as substrate `EmaOracle` storage
changes (§1.6).

## 2.5 Encoded substrate-asset reference (20-byte H160)

Several oracle adapters and the hybrid aggregator accept an "asset reference"
formatted as a 20-byte H160 instead of pointing to a real EVM contract. When
called via the EVM precompile path, the address is **parsed**, not invoked.

### 2.5.1 Layout

```
Offset (bytes)  Field          Width  Description
─────────────────────────────────────────────────────────────────────────────
  0..2          version        3      0x000001  (constant marker, "substrate-asset, v1")
  3             period         1      OraclePeriod index (§1.3)
  4..11         source         8      ASCII tag identifying the EmaOracle source (§1.2)
 12..15         assetA         4      u32 BE — first asset id
 16..19         assetB         4      u32 BE — second asset id
```

### 2.5.2 Decoded examples

| Encoded address                                | period       | source     | pair               | Used by                              |
| ---                                            | ---          | ---        | ---                | ---                                  |
| `0x00000100626966726f73746f000000050000000f`   | `LastBlock`  | `bifrosto` | (5, 15) DOT, vDOT  | vDOT-Discount-Hybrid (`0xAaFd…6185`) |
| `0x00000102626966726f73746f000000050000000f`   | `TenMinutes` | `bifrosto` | (5, 15) DOT, vDOT  | VDOT-USDOracleAdapter                |
| `0x0000010200000000000000000000000a00000000`   | `TenMinutes` | (zeros)    | (10, 0)  USDT, HDX | HDX-USDOracleAdapter                 |
| `0x0000010200000000000000000000000a0000000e`   | `TenMinutes` | (zeros)    | (10, 14) USDT, BNC | BNC-USDOracleAdapter                 |
| `0x00000102737461626c657377000003e9000002b2`   | `TenMinutes` | `stablesw` | (1001, 690)        | GDOT-USDOracleAdapter                |
| `0x00000102737461626c657377000003ef00001068`   | `TenMinutes` | `stablesw` | (1007, 4200)       | 2-POOL-GETH-USDOracleAdapter         |
| `0x00000102737461626c657377000003f100015f91`   | `TenMinutes` | `stablesw` | (1009, 90001)      | 2-POOL-GSOL-USDOracleAdapter         |
| `0x00000102737461626c65737700000414 0000273c`  | `TenMinutes` | `stablesw` | (1044, 10044)      | 2-POOL-HEURC-USDOracleAdapter        |
| `0x00000102737461626c657377000003ea00000067`   | `TenMinutes` | `stablesw` | (1002, 103)        | 3-POOL-USDOracleAdapter              |

> Observation: **every** Hydration `*OracleAdapter` reads `TenMinutes`. Only
> the Bifrost-relayed leg of the vDOT-Discount-Hybrid reads `LastBlock` — it
> consumes the keeper's raw push directly, with no further smoothing, because
> the relay payload itself is a finalized number.

### 2.5.3 Decoder (TypeScript reference)

```ts
const PERIODS = ['LastBlock', 'Short', 'TenMinutes', 'Hour', 'Day', 'Week'] as const;
type OraclePeriod = (typeof PERIODS)[number];

interface SubstrateAssetRef {
  period: OraclePeriod;
  source: string;          // 8 chars, null-trimmed
  sourceHex: string;       // raw 8-byte hex (with 0x)
  assetA: number;
  assetB: number;
}

function decodeSubstrateAssetRef(h160: string): SubstrateAssetRef | null {
  const body = h160.toLowerCase().replace(/^0x/, '');
  if (body.length !== 40 || !body.startsWith('000001')) return null;

  const period = PERIODS[parseInt(body.slice(6, 8), 16)];
  const sourceHex = '0x' + body.slice(8, 24);
  const source = Buffer.from(body.slice(8, 24), 'hex')
    .toString('ascii')
    .replace(/\0+$/, '');
  const assetA = parseInt(body.slice(24, 32), 16);
  const assetB = parseInt(body.slice(32, 40), 16);

  return { period, source, sourceHex, assetA, assetB };
}
```

## 2.6 Discovery / mapping algorithm

Given the set of `mmAddresses` extracted from `Stableswap.PoolPegs`, the
following passes map each address to a verifiable update signal.

```
for each mmAddress:

  PASS 1 — direct emitter match (Managed)
    scan recent N blocks for PriceUpdated events with emitter == mmAddress
    on match: record (kind=Managed, emitter=mmAddress)
    cost: O(N) blocks scanned; cheap topic substring pre-filter on raw events blob

  PASS 2 — DIA value/timestamp match (DIA wrapper)
    scan recent N blocks for OracleUpdate events on any DIA contract
    for each unmapped mmAddress, call latestRoundData() at the event's block
    if (answer, updatedAt) matches the OracleUpdate payload (value, timestamp):
      record (kind=DIA, wrapper=mmAddress, underlying=event.emitter, key=event.key)

  PASS 3 — hybrid linkback (Hybrid aggregator)
    for each still-unmapped mmAddress:
      call latestRoundData() at tip → returns (answer, updatedAt)
      search the Pass-1 cache for a Managed hit whose timestamp == updatedAt
      if found: record (kind=Hybrid, wrapper=mmAddress, wrapped=hit.emitter)
      else: report unmapped (likely the substrate-asset leg moved last —
            requires a state read against §1 to attribute)
```

### 2.6.1 Scan-window sizing

Managed feeds have observed heartbeat cadences up to ~6 days:

| Window      | Days | Catches Managed heartbeat?  |
| ---         | ---  | ---                         |
| 20 000 blk  | 1.4  | ❌ frequently misses        |
| 50 000 blk  | 3.5  | ✅ minimum                  |
| 100 000 blk | 7.0  | ✅ recommended              |

At 6 s/block on Hydration: `days × 14 400 ≈ blocks`.

### 2.6.2 Why the substring pre-filter is safe

Pass 1 fetches the raw `System.Events` SCALE blob per block, then runs
`hex.includes(topicHash)` before decoding anything. The 32-byte topic hash
appears verbatim in the SCALE encoding of `Vec<H256>` (no length prefix on
fixed arrays). Collision probability is 2⁻²⁵⁶ — effectively zero — so an
`includes()` match is exact in practice.

Without the pre-filter, every block's events would be decoded; with it, only
the ~0.1–1% of blocks containing an oracle log pay the decode cost.

---

## 3. Reference

- **`galacticcouncil/aave-v3-deploy@hydration`:** Solidity contracts and
  deployment artifacts for `ManagedOracle`, `*OracleAdapter`, and
  `vDOT-Discount-HybridOracleAggregator`.
- **`pallet-ema-oracle`** (Hydration runtime): defines `Oracles` storage,
  `update_bifrost_oracle` extrinsic, `OraclePeriod` enum, `SupportedPeriods`
  config.