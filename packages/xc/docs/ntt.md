# Wormhole NTT (Native Token Transfers)

How the XC stack integrates Wormhole NTT — the per-token bridging model that replaced the
legacy TokenBridge/TokenRelayer/MRL stack. Upstream context:
[wormhole-foundation/native-token-transfers](https://github.com/wormhole-foundation/native-token-transfers),
Hydration mainnet support merged in [PR #928](https://github.com/wormhole-foundation/native-token-transfers/pull/928).

## Model

NTT has no shared bridge contract. Each token gets its own deployment on every chain it
lives on:

- **NttManager** — locks/burns on source, mints/unlocks on destination. Entry point for
  `transfer`. Per-token rate limits (outbound + inbound).
- **WormholeTransceiver** — emits/verifies the Wormhole messages. The VAA **emitter is the
  transceiver**, not the manager. Delivers via `receiveMessage(vaa)`.

Hydration is a first-class Wormhole chain: id `73`, EVM chain id `222222` (registered in
`@wormhole-foundation/sdk-base` >= 6.1.4). Transfers Ethereum <-> Hydration are direct —
no Moonbeam hop, no MRL payloads, no wrapped `_mwh` assets.

## Registry

Deployments are declared per chain, keyed by asset key:

- Type: [NttDef/NttTokenDef](packages/xc-core/src/bridge/ntt.ts) —
  `{ token, manager, transceiver: { wormhole }, emitter? }`.
- Data: declared inline in each chain def (`xc-cfg/src/chains/**`) via the `ntt`
  field of the `wormhole` definition (`WormholeDef`).
- Lookup: `Ntt.fromChain(chain, asset)` / `Ntt.isKnown(chain, asset)` /
  `Ntt.find(chain, assetKey)` / `Ntt.findByEmitter(chain, emitter)`.

Fields are platform-flavored: `token` = erc20 contract / spl mint / sui coin type;
`manager` & `transceiver.wormhole` = contract address / program id / sui state object id.

Registry contract (breaks silently if violated):

1. **One asset key per token across all chains.** `WormholeTransfer` resolves the
   destination deployment with the *source* asset key — chain-local key variants
   (the old `usdc` vs `usdc_mwh` convention) would make the destination lookup miss and
   the redeem callback silently vanish.
2. **History matching compares the VAA emitter** (wormholescan `emitterAddress.native`)
   to `emitter ?? transceiver.wormhole`. For EVM chains the transceiver contract IS the
   emitter; on Solana the emitter is a **PDA** of the transceiver program, on Sui the
   transceiver's **EmitterCap object id** — set the `emitter` field for both. Hex
   compares case-insensitive, base58 exact.
3. On EVM sources, `token` is the ERC20 the manager pulls via `transferFrom` — it is
   threaded into `ContractConfig.token` so the wallet can issue the allowance to the
   manager.

Chain-side cross-check: hydration-node `pallet-evm-accounts` keeps
`NttMinters: StorageMap<AssetId, EvmAddress>` — the on-chain registry of managers allowed
to mint. Registry entries should agree with it.

## Transfer flow

Route contract builder: [Ntt().transfer()](packages/xc-cfg/src/builders/contracts/Wormhole/Ntt.ts),
used by the `viaNtt` route templates (tags `Wormhole` + `Ntt`).

Build steps:

1. Resolve deployment from the source chain registry.
2. Quote `NttManager.quoteDeliveryPrice(dstWormholeId, '0x00')` — `[priceQuotes[], total]`;
   `total` becomes the call `value`.
3. Floor the amount to NTT wire precision — `min(8, decimals)` decimals
   (`TrimmedAmount`). The manager **reverts with `TransferAmountHasDust`** otherwise, so
   for 18-decimal tokens any amount is floored to a multiple of 1e10.
4. Recipient: for an `EvmParachain` destination the address is derived via
   `getDerivatedAddress` (see resolver rules below), then padded to bytes32 with
   `Wormhole.normalizeAddress`.
5. Flag `wrapNative` when the source asset's balance type is native gas — the manager
   only ever pulls an erc20 (see below).
6. Emit `ContractConfig { func: 'transfer', args: [amount, dstId, recipient32], value,
   token, wrapNative }` — the 3-arg `NttManager.transfer` overload (default `0x00`
   transceiver instructions, sender as refund address).

### Signer paths ([EvmPlatform](packages/xc-sdk/src/platforms/evm/EvmPlatform.ts))

`buildCalls` returns the ordered sequence `[wrap?, approve?, transfer]`, the transfer
call always last. Each prerequisite drops off once executed, so re-building after a
signed step yields a shorter sequence. `buildCall` is the head of it — consumers
rendering a multi-step flow should use `buildCalls` instead of re-deriving.

- **H160 signer** — plain EVM txs:
  - `WETH.deposit()` with `value = amount - wethBalance`, only when `wrapNative` is set
    and the held wrapped balance is short. `NttManager` pulls the erc20 via
    `transferFrom`; NTT core has no `wrapAndTransferETH`, and `NttManagerWethUnwrap`
    unwraps on **release only** — so a native-gas source (Ethereum ETH) must be
    wrapped upfront. Pre-existing WETH is consumed first.
  - `approve(manager, amount)` when allowance is short (token address from
    `ContractConfig.token`).
  - `transfer`.
- **ss58 signer on an EvmParachain** — wrapped via
  [SubstrateEvm](packages/xc-sdk/src/platforms/substrate/SubstrateEvm.ts) into `EVM.call`
  extrinsic(s), the same sequence batched with `Utility.batch_all` (one signature).
  `EVM.call` runs under `EnsureAddressTruncated`: the evm source must be the signer's
  truncated H160 and the account **must be bound on chain**, otherwise gas/token balances
  resolve to the unrelated `ETH\0` phantom account.

### Fee of a native-gas source

With `wrapNative` the amount, the delivery price (`value`) and the gas of all three txs
come out of one ETH balance, and `max` is derived as `balance - fee`. So `estimateFee`
charges for the whole sequence — prerequisite gas + transfer gas + `value` — rather than
transfer gas alone. Two consequences:

- The transfer can't be gas-estimated while a prerequisite is pending (it reverts with no
  allowance/WETH), so a `FeeGas` ceiling stands in until nothing is pending. These are
  realistic evm bounds, unlike the fatter `Gas` ceilings an `EVM.call` declares upfront —
  overstating only shrinks `max`, gas being metered on chain.
- An erc20 source keeps the old gas-only fee: its `value` is either already reported as
  the route's destination fee (Snowbridge does this) or drawn from a balance the amount
  doesn't compete for. Folding it in unconditionally would double-count.

`Wallet` estimates the fee at a small probing amount (`initAmount`) before `max` exists,
so the ceiling headroom is also what absorbs a prerequisite that only materializes at the
larger amount.

### Address resolution ([HydrationEvmResolver](packages/xc-cfg/src/resolvers/hydration.ts))

`toH160` accepts: `ETH\0`-prefixed evm accounts (extracts the real H160) and
substrate-native accounts **iff bound** (verified against
`EVMAccounts.AccountExtension`); anything else throws. Never silently derive — an
unbound-native-derived recipient would receive an unrecoverable mint.

## Tracking & claim

[WormholeTransfer](packages/xc-sdk/src/clients/WormholeTransfer.ts) queries wormholescan
by the user's derived H160 and keeps only operations whose VAA emitter matches a
registered transceiver. Destination deployment is looked up by the source asset key
(registry rule 1).

Redeem is offered as soon as the VAA is emitted (`WhStatus.VaaEmitted`) and dispatches on
the destination chain type & claimer address:

- EVM chain → [EvmClaim](packages/xc-sdk/src/platforms/evm/EvmClaim.ts) —
  `WormholeTransceiver.receiveMessage(vaa)` on the destination.
- ss58 + EvmParachain → [SubstrateClaim](packages/xc-sdk/src/platforms/substrate/SubstrateClaim.ts) —
  the same calldata wrapped in `EVM.call` (bound accounts, `Gas.redeem` ceiling).
- Solana → [SolanaClaim](packages/xc-sdk/src/platforms/solana/SolanaClaim.ts) — via
  `@wormhole-foundation/sdk-solana-ntt` (post VAA + receive/redeem/release); returns
  multiple calls to sign & send in order, jito tip on the final one.
- Sui → [SuiClaim](packages/xc-sdk/src/platforms/sui/SuiClaim.ts) — single move
  transaction mirroring the reference sui NTT sdk (`parse_and_verify` →
  `validate_message` → `ntt::redeem` → `ntt::release`), built with the v1 mysten
  client (the published sui NTT sdk requires @mysten/sui v2 grpc, incompatible with
  this stack).

Claim caveats (inherited from the upstream SDKs, verified against 7.2.0):

- **Solana**: the payer should be the VAA recipient — upstream only creates the
  *payer's* ATA while release targets the *recipient's*, so claiming for a third party
  fails if their ATA is missing. No already-redeemed guard (re-claiming builds a tx
  that fails on-chain). Worst case post-VAA + redeem is 5-6 txs vs the jito 5-tx
  bundle cap. `SolanaNtt` program version is the constructor default `3.0.0` — fine
  for 2.x/3.x managers, would need `SolanaNtt.getVersion` for a 1.x deployment.
- **Sui**: single attestation only — threshold >= 2 multi-transceiver deployments
  would abort (`redeem` returns early before votes reach threshold). A transfer
  queued by the inbound rate limit aborts the whole tx (`ECantReleaseYet`) — same as
  upstream, which just retries later.

If the inbound rate limit queues a delivered transfer, `completeInboundQueuedTransfer`
(manager call, digest-keyed) releases it after the limit window. Digest derivation from
the VAA is not implemented yet — the method is exposed but unreachable from transfer
history alone.

## Delivery: self-redeem vs executor

Current model is **self-redeem**: plain `NttManager.transfer` relies on the transceiver's
built-in relaying config for delivery; with none configured, `quoteDeliveryPrice` is ~0
and nobody delivers the VAA — the user (or an own relayer) completes via `receiveMessage`.
This is why the redeem callback is offered immediately.

The upstream alternative is the **executor** flow (`nttWithExecutor.ts` upstream): call
the `NttManagerWithExecutor` wrapper —
`transfer(nttManager, amount, dstChain, recipient32, refund32, instructions,
executorArgs { value, refundAddress, signedQuote, instructions },
feeArgs { transferTokenFee, nativeTokenFee, payee })` — paying
`msgValue = deliveryPrice + executor cost (+ fees)`; the Executor service then delivers
on destination. The `signedQuote` comes from the off-chain Executor quote API.

Two distinct contracts — don't conflate:

| Contract | Where declared | Hydration mainnet |
| --- | --- | --- |
| Executor service (relayer watches it) | chain def `wormhole.executor`, `Wormhole.getExecutor()` | `0xd633d8d1ceee8c8252196d44857c0f41b8dcb0d9` |
| `NttManagerWithExecutor` wrapper (user calls it) | upstream `nttManagerWithExecutorAddresses` registry — not in SDK config yet | `0xd3Dda7c8608Ea251C42c6E0A2A686aDc5e9C0C03` |

Wiring the executor path is the main open decision: wrapper addresses in chain defs, an
executor-flavored transfer builder, and a signed-quote fetch client.

## Support matrix

| Chain | Send (source side) | Tracking | Manual claim |
| --- | --- | --- | --- |
| Ethereum / Base | yes (`Ntt().transfer()`) | yes | yes (`EvmClaim`) |
| Hydration | yes (evm or `EVM.call`-wrapped) | yes | yes (`EvmClaim`/`SubstrateClaim`) |
| Solana | destination only | yes (`emitter` pda entry) | yes (`SolanaClaim`) |
| Sui | destination only | yes | yes (`SuiClaim`) |

All chains are wired as NTT *destinations*; sending *from* Solana/Sui needs NTT
program/move transfer builders (the deleted TokenBridge ones were platform-specific) —
pending, tracked below.

## Open items

- Executor wiring (above) — until then, transfers complete via manual redeem only.
- Registry population — all chain `wormhole.ntt` registries are empty until per-token
  NttManager deployments land.
- Solana/Sui **outbound** transfer builders (`program`/`move` route configs) via
  `@wormhole-foundation/sdk-solana-ntt` on top of the surviving tx scaffolding
  (`SolanaLilJit`, `serializeV0`, `SolanaSigner`).
- Dependency pin: `sdk-solana-ntt`/`sdk-definitions-ntt` 7.2.0 peer on wormhole sdk
  `^5.0.0` while this stack is on 6.1.4 (which added Hydration/chain 73). Lock-driven
  installs (`npm i`/`npm ci` with the committed lockfile) work as-is; only a fresh
  no-lockfile resolve hits ERESOLVE and needs `--legacy-peer-deps` (npm `overrides`
  can't silence peer-range conflicts). Goes away with the first upstream release cut
  after native-token-transfers PR #928, then bump the pins. Publishing waits on that
  release.
- Queued-transfer digest derivation (NTT message digest from the VAA payload) — unlocks
  `completeInboundQueuedTransfer` from transfer history.
- For an **erc20** source the delivery price (`value`) is still not surfaced as a fee, so
  `FeeValidation` can pass on an ETH balance too small to cover it. Harmless while
  self-redeem keeps the quote at ~0, and `max` is unaffected there (fee asset ≠ transfer
  asset). Fix it **with the executor wiring**, which is what makes the value large: the
  Snowbridge shape — destination fee in `eth` via a `FeeAmountBuilder().Wormhole()
  .quoteDeliveryPrice()` instead of `{ amount: 0 }`. Only the erc20 routes need it; a
  native source already charges the value through the source fee (above), and applying
  both to one route would double-count it and inflate `min`.
- Wrapping leaves sub-`TrimmedAmount` dust wrapped (≤1e10 wei), as the amount is
  floored for the manager args but wrapped in full.
