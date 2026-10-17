---
'@galacticcouncil/xc-core': minor
'@galacticcouncil/xc-cfg': minor
'@galacticcouncil/xc-sdk': minor
---

NEAR and Zcash mainnet routes

- NEAR and ZEC move between NEAR and hydration over ntt, self-redeem on both ends
- An ntt transfer to a NEAR implicit account publishes it as the refund address; `NearClaim.findRecipient` reads it back, so any NEAR account can claim it
- Zcash to hydration: a deposit to an Omni address, minted into the NEAR ntt manager
- Hydration to Zcash: one call to the utxo emitter; bots redeem on NEAR and withdraw through Omni's connector
- Routes can pay a deposit address (`deposit` config), signed on Zcash by `ZecSigner`; the zcash chain reads balances through a registered reader
