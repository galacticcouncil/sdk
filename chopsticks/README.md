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

## Probes (`src/probes`)

### `nearNtt.ts` — NEAR testnet <-> Hydration over NTT

The NEAR half is the live testnet deployment of whm near-ntt. Hydration is on no wormhole testnet,
so its half is deployed on the fork, at the addresses the NEAR contract is peered with
(`testnet.registerNear` in xc-cfg). Every user step goes through the sdk:

1. fork hydration, deploy the wNEAR NTT pair the way hydration-ntt does
2. NEAR testnet -> hydration: sdk transfer signed with a NEAR key; the vaa is signed by the testnet
   guardian
3. claim it on the fork with the sdk's `EvmClaim` - the core's guardian set at the vaa's index is
   substituted with the key(s) that signed it, so the real core verifies it
4. hydration -> NEAR testnet: sdk transfer on the fork, burn & published message checked - nothing
   observes the fork, so it is not delivered

```sh
# hydration-ntt contracts, once - the prod profile (via-ir), or NttManager outgrows the
# 24576 byte contract limit: (cd <hydration-ntt> && git submodule update --init --recursive)
(cd <hydration-ntt>/evm && FOUNDRY_PROFILE=prod forge build --skip test --skip script)

HYDRATION_NTT_OUT=<hydration-ntt>/evm/out \
NEAR_ACCOUNT=<you>.testnet NEAR_KEY=ed25519:… npm run probe:near

# deliver an earlier NEAR testnet transfer instead of sending one
HYDRATION_NTT_OUT=… npm run probe:near -- --emitter <hex> --sequence <n>
```

| Env | |
| --- | --- |
| `HYDRATION_NTT_OUT` | hydration-ntt `evm/out` (forge artifacts) |
| `NEAR_ACCOUNT`, `NEAR_KEY` | testnet sender and its `ed25519:` key (faucet: `helper.testnet.near.org`) |
| `NEAR_AMOUNT` | NEAR to send, `0.1` by default - native near, wrapped in the same transaction |
| `NEAR_RECIPIENT` | NEAR account step 4 sends back to, `NEAR_ACCOUNT` by default |
| `HYDRATION_ENDPOINT` | endpoint to fork, dwellir by default (catfish rate-limits the lazy reads) |
