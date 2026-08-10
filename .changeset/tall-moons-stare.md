---
'@galacticcouncil/xc-core': minor
'@galacticcouncil/xc-cfg': minor
'@galacticcouncil/xc-sdk': minor
---

Wormhole NTT executor delivery & rate limits.

- **Executor delivery** — the sender pays for destination delivery instead of signing a
  redeem there. Offered alongside the self-redeem route for the same pair. Hydration
  calls the manager and the Executor directly rather than through the shim, whose
  unbounded approve its erc20 precompile rejects.
- **Rate limits** — per-token NttManager 24h inbound/outbound limits are read and
  validated before a transfer is built, so a capped transfer fails up front instead of
  reverting on redeem.
- **NTT clients per platform** — one client interface over the evm, solana and sui
  deployments, replacing the per-call-site branching.
- **Solana** — jito bundle endpoints, token-2022 associated token accounts, and ata
  derivation shared through `xc-core`. A redeem now opens the recipient's ata, not only
  the payer's.
- Destination fee swap is sized to the fee plus existential deposit, and source fee
  estimation covers the whole call sequence rather than the transfer alone.

Call builders return an ordered config vector instead of hanging
`prior`/`follow`/`prerequisites` off the configs themselves, and hydration's ss58 leg
becomes an `ExtrinsicBuilder().evm().call()` extrinsic, so a route composes it with the
rest of its batch and the fee is quoted by the runtime in the sender's fee currency.

The MRL transact surface is dropped along with it — nothing has declared
`AssetRoute.transact` since MRL was removed, so every path behind it was dead.