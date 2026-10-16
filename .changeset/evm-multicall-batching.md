---
'@galacticcouncil/sdk-next': minor
'@galacticcouncil/xc-cfg': patch
---

Fewer RPC requests for EVM reads and pool loading

- batch concurrent hydration EVM reads through multicall
- skip balance reads for xyk pools that can never route
- read stableswap tradability and share issuance in batches
