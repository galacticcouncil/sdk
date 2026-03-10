---
"@galacticcouncil/xc-core": minor
"@galacticcouncil/xc-cfg": minor
---

Add InstaBridge support for EURC transfers from Base to Hydration

- Added InstaBridge ABI and contract builder
- Added InstaBridgeDef type and getInstaBridge() method to EvmChain
- Added toHydrationPrecompile() helper for converting Hydration asset IDs to EVM precompile addresses
- Added InstaBridge route template for Base -> Hydration EURC transfers
