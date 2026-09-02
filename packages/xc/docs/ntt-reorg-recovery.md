# NTT messages lost to a Hydration reorg

A Wormhole message published from Hydration can be dropped by the guardians even though the
burn is canonical and irreversible. This is not a consistency-level problem — it is caused by
Hydration's synthetic EVM transaction hash changing when an extrinsic is re-included after a
fork. This doc covers what happens, how to find the surviving transaction, and how to get the
message signed.

## What happens

Substrate-dispatched EVM calls are not real Ethereum transactions. Frontier fabricates a
*synthetic* one so they are visible over `eth_*`:

```
from  = to = 0x73796e74680000000000000000000073796e7468   <- ASCII "synth"
r = s = 0x0101...01                                      <- dummy signature
gas = gasPrice = value = 0
nonce = 0xd1d8bc0002                                     <- block number + index
input = <4-byte selector>
      + <substrate block hash>
      + <substrate extrinsic hash>
      + <extrinsic index>
```

The synthetic hash is a function of a payload that **contains the substrate block hash**. So
when the best chain reorgs and the same signed extrinsic is re-executed in a different block,
it surfaces under a **different** EVM tx hash. Nothing was resubmitted; only the derived hash
moved.

The guardian EVM watcher parks each observation keyed by the tx hash it first saw, then after
the requested finality re-fetches it
([watcher.go](https://github.com/wormhole-foundation/wormhole/blob/main/node/pkg/watchers/evm/watcher.go)):

```go
txreceipt, err := w.ethConn.TransactionReceipt(timeout, eth_common.BytesToHash(pLock.message.TxID))
...
if errors.Is(err, ethereum.NotFound) || ... {
    logger.Warn("tx was orphaned", ...)
    delete(w.pending, key)     // dropped permanently
```

On a normal EVM chain a re-included tx keeps its hash, so this lookup succeeds and a sibling
branch handles the changed block. On Hydration the lookup can never succeed — the hash it
holds no longer exists — and the replacement block's log does not re-enter the pipeline
because the poller advances by block number and does not re-emit a replaced height. The
message is silently lost while the tokens stay burned.

Waiting for finality does not help: the check that fails runs *after* the wait, and it fails
on the hash.

### Reference incident (2026-08-23)

| | |
|---|---|
| Message | chain 73 / emitter `0x4e7b1e55d2354d4dc6abd876096dc201de0541d1` / sequence 45 |
| Amount | 23,748.407858 PRIME, burned in BURNING mode |
| Wormholescan tx | `0xdb359f29…` — orphaned, `eth_getTransactionByHash` returns `null` |
| Canonical tx | `0xc758dd19…` in block 13752508 |
| Extrinsic | `0x7fc8f3e4…`, index 2 — identical in both blocks |
| Outcome | no VAA for 45; sequences 43, 44, 46, 47 all signed |

The fork is visible in the block timestamps — `13752507` at `20:42:39`, `13752508` at
`20:43:18`. Wormholescan timestamps the source tx at `20:42:48`, inside that gap.

## Finding the canonical tx hash

The dead hash carries no information. Recover the live one from the message identity — the
`(emitter, sequence)` pair, which the VAA id and the Wormholescan operation both give you —
by scanning the core bridge's `LogMessagePublished` around the reported timestamp.

```ts
import {
  createPublicClient, http, parseAbi, decodeEventLog, pad, getAddress,
} from 'viem';

const LOG_MESSAGE_PUBLISHED =
  '0x6eb224fb001ed210e379b335e35efe88672a8ce935d981a6896b27ffdf52a3b2';

const CORE_ABI = parseAbi([
  'event LogMessagePublished(address indexed sender, uint64 sequence, uint32 nonce, bytes payload, uint8 consistencyLevel)',
]);

/** Block whose timestamp first reaches `ts` (unix seconds). */
async function blockAtTimestamp(client, ts) {
  let lo = 1n;
  let hi = await client.getBlockNumber();
  while (lo < hi) {
    const mid = (lo + hi) / 2n;
    const { timestamp } = await client.getBlock({ blockNumber: mid });
    if (Number(timestamp) < ts) lo = mid + 1n;
    else hi = mid;
  }
  return lo;
}

/** Canonical tx that published a given (emitter, sequence), searched around `ts`. */
async function findCanonicalTx(client, { core, emitter, sequence, ts, span = 500n }) {
  const centre = await blockAtTimestamp(client, ts);
  const from = centre > span ? centre - span : 1n;
  const to = centre + span;
  const emitterTopic = pad(getAddress(emitter).toLowerCase(), { size: 32 });

  for (let start = from; start <= to; start += 2000n) {
    const end = start + 1999n > to ? to : start + 1999n;
    const logs = await client.getLogs({ address: core, fromBlock: start, toBlock: end });
    for (const log of logs) {
      // hydration ignores the `topics` filter arg — match client-side
      if (log.topics[0].toLowerCase() !== LOG_MESSAGE_PUBLISHED) continue;
      if (log.topics[1].toLowerCase() !== emitterTopic) continue;
      const { args } = decodeEventLog({ abi: CORE_ABI, topics: log.topics, data: log.data });
      if (args.sequence !== BigInt(sequence)) continue;
      return {
        txHash: log.transactionHash,
        blockNumber: log.blockNumber,
        blockHash: log.blockHash,
      };
    }
  }
  return undefined;
}

/** Substrate identity behind a synthetic (substrate-dispatched) evm tx. */
function decodeSyntheticTx(input) {
  const body = input.slice(10); // strip the 4-byte selector
  return {
    blockHash: `0x${body.slice(0, 64)}`,
    extrinsicHash: `0x${body.slice(64, 128)}`,
    extrinsicIndex: Number(BigInt(`0x${body.slice(128, 192)}`)),
  };
}
```

Verified against the reference incident:

```ts
const client = createPublicClient({ transport: http('https://rpc.hydradx.cloud') });

await findCanonicalTx(client, {
  core: '0x3792a6d63c31941b2805181771795d9176fa82a1',
  emitter: '0x4e7b1e55d2354d4dc6abd876096dc201de0541d1',
  sequence: 45,
  ts: Math.floor(Date.parse('2026-08-23T20:42:48Z') / 1000),
});
// { txHash: '0xc758dd19…', blockNumber: 13752508n, blockHash: '0x3cde3024…' }

decodeSyntheticTx((await client.getTransaction({ hash: '0xc758dd19…' })).input);
// { blockHash: '0x4eef21bb…', extrinsicHash: '0x7fc8f3e4…', extrinsicIndex: 2 }
```

Two identities survive a reorg; the EVM tx hash does not:

- **Substrate** — the extrinsic hash. Identical in the orphaned and the canonical block
  because the signed bytes never change. This is what Subscan resolves.
- **Wormhole** — `(emitterChain, emitterAddress, sequence)`. The VAA digest covers emitter,
  sequence, consistency level and payload, never the tx hash.

## Resurrecting a dropped message

The message is on-chain, so it only needs re-observing — no re-burn, no new Hydration tx. Two
guardian commands do it, both taking a tx hash:

```
guardiand admin send-observation-request 73 <canonical-tx-hash>
guardiand admin reobserve-with-endpoint  73 <canonical-tx-hash> <hydration-rpc-url>
```

Neither is public. They reach a running node over its local admin socket, and the node signs
the gossiped request with its guardian key; every receiver rejects a signer outside the
current guardian set. `reobserve-with-endpoint` is local to one node, so it yields one
signature — quorum still needs ~2/3 of operators.

So the path is Wormhole support (Discord / NTT channel). Give them:

- chain `73` and the **canonical** tx hash from `findCanonicalTx`
- the missing `(emitter, sequence)`
- that the neighbouring sequences are signed, so it is an isolated miss

The canonical hash is the part that matters. A re-observation request carrying the
Wormholescan hash fails not-found and the message stays dead — the same failure repeating.
`reobserve-with-endpoint` exists for operators whose own RPC cannot serve the data;
Hydration's `finalized` tag trails `latest` by only ~4 blocks and archive state is served, so
any operator pointed at `https://rpc.hydradx.cloud` can re-observe directly.

## Prevention

- **Derive the synthetic tx hash from the extrinsic hash, not the substrate block hash.** The
  extrinsic hash is already carried in the synthetic `input` and is stable across
  re-inclusion. This closes the hole for every Wormhole message on Hydration, and stops
  `eth_getTransactionByHash` from lying to every other indexer watching the chain.
- **Never key cross-chain tracking on the EVM tx hash.** On Hydration it is reorg-unstable
  for anything substrate-originated. Track `(emitter, sequence)` and treat the tx hash as
  display metadata that may change.
- **Reconcile against `nextMessageSequence()`.** A gap between the manager's sequence counter
  and the set of signed VAAs is the cheap detector for exactly this loss.
