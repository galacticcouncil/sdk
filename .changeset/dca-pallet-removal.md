---
'@galacticcouncil/sdk-next': patch
---

Keep sdk working on runtimes without the DCA pallet and with destroyed pools

- Read the minimal order period from the intent pallet
- Fall back to the default minimum order budget when the DCA pallet is gone
- Skip share and bond assets whose pool or bond no longer exists, as a destroyed stableswap pool leaves its share asset in the registry
