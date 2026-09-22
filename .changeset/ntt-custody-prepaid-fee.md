---
'@galacticcouncil/xc-core': minor
'@galacticcouncil/xc-cfg': minor
'@galacticcouncil/xc-sdk': minor
---

Guard ntt transfers against the two ways they strand on a locking destination

- executor routes declare their delivery cost as prepaid, so max and the fee check reserve it when it shares the transfer asset
- new custody validation rejects amounts a locking destination cannot release
- transfer validate accepts the amount, so amount-bound checks are reachable
