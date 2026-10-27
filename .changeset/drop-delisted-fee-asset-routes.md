---
'@galacticcouncil/xc-cfg': patch
---

Drop inbound routes for assets no longer accepted as fee currency on hydration

- ASTR, BNC, vASTR, IBTC, INTR, NEURO, UNQ and KSM transfers to hydration paid the destination fee in the asset itself and now get trapped
- Outbound routes from hydration stay so holders can still withdraw
