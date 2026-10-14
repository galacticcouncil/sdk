---
'@galacticcouncil/xc-core': minor
'@galacticcouncil/xc-cfg': minor
'@galacticcouncil/xc-sdk': minor
'@galacticcouncil/xc-swap': minor
---

NEAR and ZEC mainnet routes, Zcash transfers in xc-swap

- NEAR and ZEC move between NEAR and hydration over ntt, self-redeem on both ends
- An ntt transfer to a NEAR implicit account publishes it as the refund address; `NearClaim.findRecipient` reads it back, so any NEAR account can claim it
- xc-sdk signs Zcash payments (`ZecSigner`, `toZecPaymentUri`); the zcash chain reads balances through a registered reader
- xc-swap `createZcashTransfers`: hydration ZEC to Zcash through 1Click, Zcash to hydration through Omni, each in the shape of an xc-sdk `Transfer`
