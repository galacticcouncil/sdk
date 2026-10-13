---
'@galacticcouncil/xc-core': minor
'@galacticcouncil/xc-cfg': minor
'@galacticcouncil/xc-sdk': minor
'@galacticcouncil/xc-swap': minor
---

NEAR and ZEC mainnet routes over ntt, and Zcash into hydration through Omni

- NEAR mainnet carries the whm near-ntt deployments locking wNEAR and Omni's ZEC
- Hydration lists them as NEAR and ZEC, burned and minted by their peered managers
- NEAR and wNEAR move to hydration as NEAR, ZEC as ZEC; NEAR returns as wNEAR, ZEC as ZEC, self-redeem on both ends
- A `payment` route config: one plain payment to an address a bridge derives from the order
- Zcash routes zec to hydration: Omni mints the deposit into the NEAR ntt manager, which locks and publishes
- xc-swap ships the Omni client next to 1Click; the integrator registers it on the zcash chain, and without one the route fails closed
- The client uses Omni's deposit address only once the connector's own derivation of the order matches it
- Orders are registered without a public NEAR record pairing the source and recipient addresses
- Checked before anything is paid: Omni's live minimum and the NEAR manager's rate limits, since a refused deposit is only refundable by hand
- A payment below Omni's minimum deposit is never built
- A zec platform builds the payment, as a zip-321 request or for a wallet that settles the network fee itself
- Zcash balances come from a reader the integrator registers on the chain