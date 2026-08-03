---
'@galacticcouncil/sdk-next': minor
'@galacticcouncil/xc-core': minor
'@galacticcouncil/common': minor
'@galacticcouncil/xc-cfg': minor
'@galacticcouncil/xc-sdk': minor
---

Collapses per-asset balance subscriptions onto one account-keyed read where the
chain allows it, memoizes platform clients that were being rebuilt on every
read, and splits the one-shot (asset picker) case from the live (selected
asset) case.