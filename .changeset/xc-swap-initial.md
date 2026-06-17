---
'@galacticcouncil/xc-swap': minor
---

Add `xc-swap` — cross-chain swap SDK for Hydration → NEAR (NEAR Intent Routing).
Exposes supported assets/chains/routes and provides `estimateTrade(...)`, which
returns a trade that builds the executable EVM calls (`approve` +
`IntentEmitter.swapAndBridge`) on Hydration's EVM layer. Phase 1 targets the
`nep141:wrap.near` destination asset.
