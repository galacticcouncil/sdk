---
'@galacticcouncil/sdk-next': patch
---

Keep sdk context working on runtimes without the DCA pallet

- Read the minimal order period from the intent pallet
- Fall back to the default minimum order budget when the DCA pallet is gone
