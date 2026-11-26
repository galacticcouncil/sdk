---
'@galacticcouncil/sdk-next': major
'@galacticcouncil/descriptors': minor
---

Remove the legacy DCA pallet, retired in runtime 462

- Bump descriptors to latest metadata (runtime 462)
- DCA and TWAP orders are built as intent orders only
- Orders follow the chain's per-trade minimums (existential deposits) instead of a fixed minimum budget
