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
no Moonbeam hop, no MRL payloads, no wrapped `_wh` assets.

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
   (the old `usdc` vs `usdc_wh` convention) would make the destination lookup miss and
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

One builder per source platform, all tagged `Wormhole` + `Ntt`:
[contracts/Wormhole/Ntt](packages/xc-cfg/src/builders/contracts/Wormhole/Ntt.ts) (evm,
below), [programs/Wormhole/Ntt](packages/xc-cfg/src/builders/programs/Wormhole/Ntt.ts)
(solana) and [moves/Wormhole/Ntt](packages/xc-cfg/src/builders/moves/Wormhole/Ntt.ts)
(sui).

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

### Sui source ([moves/Wormhole/Ntt](packages/xc-cfg/src/builders/moves/Wormhole/Ntt.ts))

One move transaction, mirroring the reference sui NTT sdk transfer — the published one
is unusable here (it requires @mysten/sui v2 grpc), same as for
[SuiClaim](packages/xc-sdk/src/platforms/sui/SuiClaim.ts):

`ntt::prepare_transfer` → `state::get_next_sequence` → `ntt::transfer_tx_sender` →
`state::create_transceiver_message` → `wormhole_transceiver::release_outbound` →
`publish_message::publish_message`, with the trimmed remainder handed back by
`prepare_transfer` merged into gas.

Sui specifics:

- Move calls target the **current** package id of an upgradeable package, not the id its
  State object was created under — the manager, transceiver and core bridge package ids
  are resolved from chain per build (`suiPkg` helpers in xc-core, shared with `SuiClaim`).
  The registry only carries State object ids.
- The amount is **not** floored: `prepare_transfer` trims to wire precision itself and
  returns the remainder as a `Balance`, unlike the evm manager which reverts on dust.
- `should_queue` is always false — a rate-limited transfer aborts rather than parking an
  outbox item that transfer history can't release.
- The coin is split off gas: only native SUI is registered on the chain
  (`SuiBalanceType.Native`). A coin-type source would need the coin selection & merge
  branch of the reference sdk.
- Fee is whatever the [SuiPlatform](packages/xc-sdk/src/platforms/sui/SuiPlatform.ts)
  dry run reports (computation + storage); the wormhole message fee is 0.

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

Two delivery models, one builder each, **both offered for the same pair**. The route
registry groups by `sourceAsset-destChain-destAsset` into a list ([ChainRoutes](packages/xc-core/src/config/definition/ChainRoutes.ts)),
so each ntt pair carries two routes and the consumer picks by tag — the executor one is
tagged `Ntt` **and** `NttExecutor`, so anything already matching on `Ntt` still sees both.
Same shape as the Snowbridge V1/V2 pair.

Plain `NttManager.transfer`
([Ntt().transfer()](packages/xc-cfg/src/builders/contracts/Wormhole/Ntt.ts)) is
**self-redeem**: it relies on the transceiver's built-in relaying config; with none
configured `quoteDeliveryPrice` is ~0 and nobody delivers the VAA — the user (or an own
relayer) completes via `receiveMessage`.

`Ntt().transferWithExecutor()` calls the **`NttManagerWithExecutor`** shim instead —
`transfer(nttManager, amount, dstChain, recipient32, refund32, instructions,
executorArgs { value, refundAddress, signedQuote, instructions },
feeArgs { transferTokenFee, nativeTokenFee, payee })`, selector `0xce972e0e` — paying
`msgValue = deliveryPrice + estimatedCost`, after which the Executor service delivers on
destination. Referrer fees are both zero, so the full amount bridges and `payee` is inert.

Only the erc20 `transfer` overload is used. The shim's `transferETH` wraps the attached
value itself, but a native gas source is already wrapped upfront by the same prerequisite
the plain manager needs — so that path never comes up, and the platform's allowance
derivation (spender = `ContractConfig.address`) lands on the shim unchanged.

Two distinct contracts — don't conflate:

| Contract | Where declared | Hydration mainnet |
| --- | --- | --- |
| Executor service (relayer watches it) | chain def `wormhole.executor`, `Wormhole.getExecutor()` | `0xd633d8d1ceee8c8252196d44857c0f41b8dcb0d9` |
| `NttManagerWithExecutor` shim (user calls it) | chain def `wormhole.nttExecutor`, `Wormhole.getNttExecutor()` | `0xd3Dda7c8608Ea251C42c6E0A2A686aDc5e9C0C03` |

Ethereum `0xC079bFA54F348199bA51B2717595fE24e96f1542`, Base
`0x27db1967D469D89318B7119Ced5609f327095de4`. The `NttManagerWithExecutorWithToken`
variant (relay fee paid in an ERC20, EQ03) is Tempo-only and unused here.

### The shim does not work from hydration

`NttManagerWithExecutor` approves the manager for `type(uint256).max`. Hydration's erc20
precompile carries a **u128** balance and reverts anything above `uint128` max with
`"value too big for type"`, so every shim call from hydration fails — inside `EVM.call`,
which swallows the revert and reports `Utility.BatchCompleted` over an
`EVM.ExecutedFailed`. `allowance(shim → manager)` on hydration is still 0: it has never
once succeeded. Ethereum and Base are unaffected, their tokens being real erc20s.

`Ntt().transferViaExecutor()` is the way around it — the same two effects as two calls
the sender owns, so the only approve is our own exact-amount one:

```
1. approve(manager, amount)          exact, from getPrerequisites
2. NttManager.transfer(...)          emits the wormhole message   (value = deliveryPrice)
3. Executor.requestExecution(...)    pays to deliver it           (value = estimatedCost)
```

Step 3 rides on `ContractConfig.follow`, the mirror of `prior`: `EvmPlatform` appends it
after the transfer and `SubstrateEvm` batches the lot. `requestExecution` is generic — it
moves no tokens and knows nothing about ntt — so `requestBytes` is what names the message:

```
ERN1 || srcChain(u16) || srcNttManager(bytes32) || sequence(u256)      70 bytes
```

decoded off a live base relay, since the wormhole sdk ships the prefix enum and no body
layout. `dstAddr` is the **destination** manager (whom the executor calls to redeem), not
the recipient. The sequence comes from `nextMessageSequence()` read at build time, so a
transfer through the same manager landing in between leaves the request pointing at the
wrong message — nothing is relayed and the transfer stays claimable by hand.

### Quoting ([ExecutorClient](packages/xc-cfg/src/clients/executor.ts))

`POST https://executor.labsapis.com/v0/quote {srcChain, dstChain, relayInstructions}` →
`{signedQuote, estimatedCost}`. `relayInstructions` is one `GasInstruction` carrying a
`gasLimit` (what the redeem may spend) and a `msgValue` (what the executor must *hold* to
run it). Under-budgeting either makes the relay simulation revert and the transfer is
never delivered.

**Neither is uniform, and neither unit survives a chain boundary** — evm gas on evm,
compute units on svm, MIST on sui, where the "gas limit" is a real transaction budget
rather than an abstract count. Upstream models this as a destination-side
`estimateMsgValueAndGasLimit(recipient)`; here it is
[executorBudget](packages/xc-cfg/src/bridges/wormhole/executor/), one builder per
destination platform:

| Destination | `gasLimit` | `msgValue` |
| --- | --- | --- |
| evm | 500,000 (upstream default) | 0 — the redeem holds nothing |
| solana | 250,000 (26 sampled redeems peaked at 87,592 CU) | 10,000,000 lamports, +2,039,280 when the recipient has no ata |
| sui | 10,000,000 MIST | 0 |

Keyed on the **destination**, not the source: hydration → sui is an evm source that must
meet sui's budget. It is the one place either number is decided, so the fee builder and
the transfer builder cannot disagree — and both are in the `ExecutorClient` cache key,
since a signed quote is only honoured for the instructions it priced.

The solana figures are measured, not upstream's. A redeem is four transactions —
`verify_signatures` ×2, `post_vaa`, then receive/redeem/release — and permanently creates
the transceiver-message and inbox-item pdas: 9,292,040 lamports with the recipient ata
already open, 11,351,320 when it must be created. Upstream's own estimator sums 9,705,000
+ 2,039,280. The ata rent is charged only when the account is actually missing (the
builder reads it), because the executor charges source native for lamports it fronts.

Sui's 10,000,000 comes from live redeems on the sui manager, which settle at ~6.48M MIST
net against a 7,556,176 budget; upstream pads the same estimate to 20,000,000.

The quoting API prices what you ask for; it does not tell you what you need. A
`msgValue: 0` request for solana returns a signed, HTTP-200, perfectly valid quote for a
delivery that cannot run — `amtPaid == estimatedCost`, then `aborted`. A short `gasLimit`
does the same and reports `underpaid`. There is no endpoint, formula or sdk helper for
the required values (`/v0/capabilities` publishes only ceilings: 30M evm, 1e9 sui, 1e6
solana), which is why every number above is measured against a real relay.

Signed quotes **expire** (an hour, currently), and one is only honoured for the
instructions it priced. Both builders quote — the fee builder to size the funding, the
transfer builder to spend it — so [ExecutorClient](packages/xc-cfg/src/clients/executor.ts)
keeps one live quote per `src:dst:msgValue` and reuses it while over five minutes of its
own expiry remain. Quoting twice instead let the destination gas price move in between:
observed drift was 807e9 wei against a 9e9 margin, which underfunds the transfer.

### Fee

`estimatedCost` is denominated in **source chain native gas** and is charged as the
route's destination fee via `FeeAmountBuilder().Wormhole().quoteExecutorCost()`
(`deliveryPrice + estimatedCost`), because an erc20 source pays it from a balance the
amount never competes for — which is exactly why `EvmPlatform.estimateFee` leaves the
call value out there.

A **native gas source is the exception**: its value is already folded into the source fee
(see above), so `toHydrationViaNttExecutorNativeTemplate` declares no destination fee.
Charging both would double-count and inflate the route minimum. Ethereum's
`eth → weth_wh` is the only such route.

The self-redeem routes keep `amount: 0`, which stays honest for them — nothing is charged
beyond gas. Note both routes of a pair are quoted when a consumer prices all of them, so
listing a pair costs one executor API call.

**On Hydration that native gas is `weth_wh` (asset 20), not `hdx`.** `pallet_evm`'s
currency is WETH, so `EVM.call { value }` debits the weth balance — `eth_getBalance`
returns it net of the ED. Two reasons the fee asset must not be `hdx`: `DestFeeValidation`
would check a balance the transfer never touches, and `hdx` declares no `decimals` in
`assetsData`, so `Chain.getDecimals` falls back to the 12-decimal chain currency and
renders an 18-decimal evm value 10^6x too large. Only the substrate extrinsic fee
(`source.fee`, via the multi-transaction-payment currency map) can be paid in hdx.

### Paying the hydration cost in hdx

A sender holding no weth buys it first, via the same destination fee swap the xcm routes
use — `FeeSwap.getDestinationSwap` enables it when the weth balance is short and the hdx
reserves cover twice the quote, and `viaNttExecutorTemplate` wraps its builder in
[ContractDecorator](packages/xc-cfg/src/builders/ContractBuilder.ts) so the `Router.buy`
leads the batch: `[Router.buy(hdx→weth), EVM.call approve, EVM.call transfer]`.

This is the contract-route counterpart of `ExtrinsicDecorator`. The difference is where
the batching happens: an extrinsic decorator can wrap both sides in `Utility.batch_all`
itself, while a contract call only becomes a substrate call once the platform knows the
origin is ss58 — so the decorator just carries the extrinsic on `ContractConfig.prior`
and [SubstrateEvm](packages/xc-sdk/src/platforms/substrate/SubstrateEvm.ts) assembles it.

**Only an ss58 origin gets this, and only it needs it.** An h160 signs a plain evm
transaction with nothing to batch into — but it also pays that transaction's gas in weth,
so an h160 that can transact at all already holds some. The swap exists for the ss58
origin precisely because that one pays its extrinsic fee in hdx and can otherwise hold
zero weth.

The failure modes differ the same way. An h160 short on weth reverts in evm simulation —
surfaced by the call's own `dryRun` and again by the wallet's gas estimate before signing.
The ss58 path is the one that hides it: `EVM.call` captures the revert, so a failed
transfer arrives as `EVM.ExecutedFailed` inside a `Utility.BatchCompleted` and the
extrinsic reports success.

Two rough edges left. `DestFeeValidation.skipFor` skips whenever
`destinationFeeSwap.enabled` is set, which `FeeSwap` decides without knowing the origin
format — so an h160 holding enough weth for gas but not for gas plus the executor cost,
and enough hdx to look swappable, loses the check (the evm dry run still catches it). And
`EvmPlatform.estimateFee` prices only the evm side, so the `Router.buy` weight is missing
from the quoted source fee.

## Support matrix

| Chain | Send (source side) | Delivery | Tracking | Manual claim |
| --- | --- | --- | --- | --- |
| Ethereum / Base | yes (`Ntt().transfer()` + `transferWithExecutor()`) | both | yes | yes (`EvmClaim`) |
| Hydration | yes (evm or `EVM.call`-wrapped) | both | yes | yes (`EvmClaim`/`SubstrateClaim`) |
| Solana | yes (`ProgramBuilder`) | self-redeem | yes (`emitter` pda entry) | yes (`SolanaClaim`) |
| Sui | builder ready, no deployment | self-redeem | yes | yes (`SuiClaim`) |

Every evm **source** offers both models side by side; Solana and Sui sources self-redeem
only (their shims — solana program `nex1gkSWtRBheEJuQZMqHhbMG5A45qPU76KqnCZNVHR`, sui
`executorId` — are deployed but unwired here, and upstream's sui path needs
`@mysten/sui` v2 grpc). Every chain in the table is a supported executor **destination**
(all advertise the `ERN1` prefix), so hydration → solana/sui gets the executor option too.

Every chain is wired both ways. The Sui legs (sui → hydration in
[configs/sui/sui.ts](packages/xc-cfg/src/configs/sui/sui.ts), hydration → sui in the
hydration config) are the only routes still commented out: no SUI NttManager is deployed
on either side yet, so both `wormhole.ntt` registries lack the entry. Uncomment the two
route lines once the deployment lands.

## Open items

- Transfer history still offers the redeem callback as soon as the VAA is emitted, which
  is now redundant on an executor-delivered transfer — the Executor is already redeeming
  it. Gate it on `POST /v0/status/tx` (`{chainId, txHash}`; a `GET` on that path 404s)
  and re-offer only on a `failed`/`underpaid`/`aborted` relay. The xc-transfer example
  polls it in `src/utils/executor.ts`.
- Solana & Sui **source** executor wiring — both shims exist upstream (above) but the
  program/move builders still emit the self-redeem call.
- Hydration `weth_wh → eth` is the one executor route whose transfer asset equals its
  destination fee asset (both `weth_wh`), so `DestFeeValidation.skipFor` treats it as
  self-funding and skips the check — while `calculateMax` only ever subtracts the
  *source* fee. `max` therefore overstates by `deliveryPrice + estimatedCost` and a
  bridge-everything transfer reverts. The skip is right for xcm routes that pay the
  destination fee out of the delivered amount; this one pays it separately from the
  same balance, which the sdk has no shape for yet.
- SUI deployment — the only token with no NttManager pair (`ops/tokens` in the
  native-token-transfers fork has none). Registry entries + the two commented routes are
  what it unblocks.
- Dependency pin: `sdk-solana-ntt`/`sdk-definitions-ntt` 7.2.0 peer on wormhole sdk
  `^5.0.0` while this stack is on 6.1.4 (which added Hydration/chain 73). Lock-driven
  installs (`npm i`/`npm ci` with the committed lockfile) work as-is; only a fresh
  no-lockfile resolve hits ERESOLVE and needs `--legacy-peer-deps` (npm `overrides`
  can't silence peer-range conflicts). Goes away with the first upstream release cut
  after native-token-transfers PR #928, then bump the pins. Publishing waits on that
  release.
- Queued-transfer digest derivation (NTT message digest from the VAA payload) — unlocks
  `completeInboundQueuedTransfer` from transfer history.
- Wrapping leaves sub-`TrimmedAmount` dust wrapped (≤1e10 wei), as the amount is
  floored for the manager args but wrapped in full.
