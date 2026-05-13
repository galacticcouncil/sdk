# Derive Solana ATA

Compute the Associated Token Account (ATA) address for a Solana wallet + SPL token mint using `@solana/spl-token`.

## When to Use

When the user asks for the ATA (or "token account") of a Solana wallet for a given mint — including wrapped SOL.

## Parameters

- **address**: Base58 Solana wallet (owner)
- **tokenId**: Either `'SOL'` (resolves to `NATIVE_MINT` = wrapped SOL) or a base58 SPL mint address

## Workflow

Mirror the pattern in [packages/xc-cfg/src/builders/contracts/Wormhole/TokenBridge.ts:103-113](packages/xc-cfg/src/builders/contracts/Wormhole/TokenBridge.ts#L103-L113). Run inline from the repo so the workspace's `@solana/spl-token` is resolved — no install needed.

```sh
cd packages/xc-cfg && npx tsx -e "
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, NATIVE_MINT } from '@solana/spl-token';

const address = 'OWNER_HERE';
const tokenId = 'SOL'; // or a base58 mint

const tokenMint = tokenId === 'SOL' ? NATIVE_MINT : new PublicKey(tokenId);
getAssociatedTokenAddress(tokenMint, new PublicKey(address))
  .then(a => console.log(a.toBase58()));
"
```

> Note: use `.then()` not top-level `await` — `tsx -e` transforms to CJS which rejects top-level await.

## Cautions

- For Token-2022 mints, pass the Token-2022 program id as the 4th/5th args of `getAssociatedTokenAddress` (see `@solana/spl-token` signature). Default is the classic SPL Token program.
- `NATIVE_MINT` is **wrapped SOL**. Native SOL has no token account — the wallet address itself holds the lamports.
- ATA may not exist on-chain yet — derivation gives the address regardless.
