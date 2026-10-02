---
'@galacticcouncil/xc-core': minor
'@galacticcouncil/xc-cfg': minor
'@galacticcouncil/xc-sdk': minor
---

NEAR support over NTT, the HyperEVM chain and the HYPE & SPY ntt routes
- NEAR chains carry a wormhole deployment, NEP-141 balances and a library-free json-rpc client
- NEAR transfers build as function calls, native near wrapped in the same transaction
- NEAR transactions are signed by a key pair or a wallet, NEAR redeems are claimed with `complete`
- NEAR testnet ships as a test chain, its routes to hydration registered by `testnet.registerNear`
- An h160 signer on hydration resolves to its account when its fee currency and balances are read
- HyperEVM ships as a chain with native HYPE and WHYPE
- HYPE (HyperEVM) and SPY (Robinhood) move over ntt, both delivery models, both ways
