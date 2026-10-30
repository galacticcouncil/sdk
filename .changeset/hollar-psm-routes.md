---
'@galacticcouncil/xc-core': minor
'@galacticcouncil/xc-cfg': minor
'@galacticcouncil/xc-sdk': patch
---

HOLLAR PSM routes between base and hydration

- USDC deposited on base is minted 1:1 as HOLLAR on hydration
- HOLLAR redeemed on hydration is paid out as USDC on base, less the vault fee
- the transfer minimum is given in the source asset's decimals when the two sides differ
