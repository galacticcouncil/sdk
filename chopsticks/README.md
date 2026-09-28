# chopsticks

Hydration forks for driving the sdk against real runtime state - jest specs and probe scripts.

## Harness (`src/lib`)

- **`spawn(spec)`** — fork a chain on [gc chopsticks](https://github.com/galacticcouncil/chopsticks)
  in Manual block mode, with a papi client. The fork answers json-rpc over http on the same port,
  `eth_*` included, so the sdk's viem reads work against it unchanged.
- **`configs`** — fork presets (`hydration`).
- **`EthClient`** — viem-signed eth wallet over a fork: `signDeploy` / `signCall`, then `sendBatch`
  seals the txs into one block as `pallet_ethereum::transact`.
- **`getEventsAt`, `getEthereumExits`, `findEvmLogs`** — a block's events, `Ethereum.Executed`
  outcomes and `EVM.Log`s, read at an explicit block hash.

Same approach as whm's chopsticks harness. EVM txs are real signed eth txs, submitted as
self-contained `Ethereum.transact` extrinsics in a block built in-process (`dev_newBlock` can't prune
a self-contained tx by hash and rebuilds the same block forever).

`CHOPSTICKS_DB` caches fetched state in sqlite for reruns; it pays off together with
`CHOPSTICKS_BLOCK` pinning the fork to one block.
