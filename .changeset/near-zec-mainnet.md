---
'@galacticcouncil/xc-core': minor
'@galacticcouncil/xc-cfg': minor
'@galacticcouncil/xc-sdk': minor
'@galacticcouncil/xc-swap': minor
---

NEAR and ZEC mainnet routes, Zcash into hydration through Omni

- NEAR and ZEC move between NEAR and hydration over ntt, self-redeem on both ends
- Zcash into hydration: one payment to an Omni deposit address, checked against Omni's minimum and the NEAR limits first
- xc-swap ships the Omni client, registered on the zcash chain by the integrator
- xc-swap withdraws ZEC held on NEAR to Zcash through 1Click
