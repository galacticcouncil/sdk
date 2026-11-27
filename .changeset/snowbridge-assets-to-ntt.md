---
'@galacticcouncil/xc-cfg': minor
---

Move hydration's snowbridge assets onto wormhole ntt

- Snowbridge v2/v1 routes between ethereum and hydration are gone for the snowbridge assets (eth, aave, apyusd, cfg, ena, lbtc, ldo, link, paxg, sky, susde, susds, tbtc, trac, usdc, usdt, wbtc, weth, wsteth)
- aave, apyusd, ena, ldo, link, paxg, sky, susde, tbtc, trac and wsteth keep their hydration asset ids and bridge over ntt both ways, self-redeem and executor
- hydration xcm locations follow the registry: `wh` provenance for the ntt assets (eth included), the retired `sb` marker for the rest
- eth reaches hydration as weth over the existing weth ntt route
- ntt manager and transceiver addresses for the new pairs are placeholders until the hubs are deployed
