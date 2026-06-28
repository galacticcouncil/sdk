---
"@galacticcouncil/sdk-next": patch
---

Event-gate ERC20 balance subscriptions. `watchErc20Balance` no longer re-reads
every ERC20 id via `CurrenciesApi.account` on every block; it seeds once, then
re-reads only the asset ids whose `EVM.Log` `Transfer` names the watched account
as `from`/`to`, with a low-frequency full re-read as a safety net. Removes the
single biggest per-block RPC cost (`chainHead_v1_call` fan-out) with no public
API change.
