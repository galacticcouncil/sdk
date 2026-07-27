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
  `{ token, manager, transceiver: { wormhole } }`.
- Data: [xc-cfg/src/ntt.ts](packages/xc-cfg/src/ntt.ts) (`ethereumNtt`, `hydrationNtt`),
  wired into the chain defs via the `ntt` field (`EvmChain`/`EvmParachain` param).
- Lookup: `Ntt.fromChain(chain, asset)` / `Ntt.isKnown(chain, asset)`.

Registry contract (breaks silently if violated):

1. **One asset key per token across all chains.** `WormholeTransfer` resolves the
   destination deployment with the *source* asset key — chain-local key variants
   (the old `usdc` vs `usdc_mwh` convention) would make the destination lookup miss and
   the redeem callback silently vanish.
2. **`transceiver.wormhole` must be the VAA emitter address.** Transfer history matching
   compares it to the wormholescan `emitterAddress.native`. For EVM chains that is the
   transceiver contract address; for a future Solana entry it is the program's **emitter
   PDA**, not the program id.
3. `token` is the ERC20 the manager pulls via `transferFrom` — it is threaded into
   `ContractConfig.token` so the wallet can issue the allowance to the manager.

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
5. Emit `ContractConfig { func: 'transfer', args: [amount, dstId, recipient32], value,
   token }` — the 3-arg `NttManager.transfer` overload (default `0x00` transceiver
   instructions, sender as refund address).

### Signer paths ([EvmPlatform](packages/xc-sdk/src/platforms/evm/EvmPlatform.ts))

- **H160 signer** — plain EVM txs: `approve(manager, amount)` when allowance is short
  (token address from `ContractConfig.token`), then `transfer`.
- **ss58 signer on an EvmParachain** — wrapped via
  [SubstrateEvm](packages/xc-sdk/src/platforms/substrate/SubstrateEvm.ts) into `EVM.call`
  extrinsic(s), approve + transfer batched with `Utility.batch_all` (one signature).
  `EVM.call` runs under `EnsureAddressTruncated`: the evm source must be the signer's
  truncated H160 and the account **must be bound on chain**, otherwise gas/token balances
  resolve to the unrelated `ETH\0` phantom account.

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
the claimer address:

- H160 → [EvmClaim](packages/xc-sdk/src/platforms/evm/EvmClaim.ts) —
  `WormholeTransceiver.receiveMessage(vaa)` on the destination.
- ss58 + EvmParachain → [SubstrateClaim](packages/xc-sdk/src/platforms/substrate/SubstrateClaim.ts) —
  the same calldata wrapped in `EVM.call` (bound accounts, `Gas.redeem` ceiling).

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

## Open items

- Executor wiring (above) — until then, transfers complete via manual redeem only.
- Registry population — `ethereumNtt`/`hydrationNtt` are empty until per-token
  NttManager deployments land.
- Solana/Sui — structurally unsupported: no `ntt` field on `SolanaChain`/`SuiChain`, no
  claim classes (the deleted ones were TokenBridge-specific). When routes return, reuse
  upstream `@wormhole-foundation/sdk-solana-ntt` for instruction building on top of the
  surviving tx scaffolding (`SolanaLilJit`, `serializeV0`, `SolanaSigner`); fix the
  case-insensitive emitter matching (base58 is case-sensitive) and store the emitter PDA
  in the registry.
- Queued-transfer digest derivation (NTT message digest from the VAA payload) — unlocks
  `completeInboundQueuedTransfer` from transfer history.
- `estimateFee` surfaces gas only; the delivery price (`value`) is not shown as a fee.
