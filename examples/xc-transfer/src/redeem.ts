import {
  EvmClaim,
  SolanaClaim,
  SubstrateClaim,
  SuiClaim,
} from '@galacticcouncil/xc-sdk';
import {
  AnyChain,
  EvmChain,
  EvmParachain,
  Ntt,
  SolanaChain,
  SuiChain,
} from '@galacticcouncil/xc-core';

import { xc } from './setup';
import { signEvm } from './signers';

const { config } = xc;

const ethereum = config.getChain('ethereum') as EvmChain;
const base = config.getChain('base') as EvmChain;
const hydration = config.getChain('hydration') as EvmParachain;
const solana = config.getChain('solana') as SolanaChain;
const sui = config.getChain('sui') as SuiChain;

const nttOf = (chain: AnyChain, assetKey: string) =>
  Ntt.fromChain(chain, config.getAsset(assetKey)!);

/**
 * Helpers for redeeming a wormhole NTT VAA on different chains.
 *
 * Each function builds the transaction call(s) required to redeem the
 * transfer on the target chain. The returned call must then be signed
 * and submitted with the appropriate signer. The asset key selects the
 * NTT deployment from the chain registry (see ntt.ts wiring).
 *
 * Example (Ethereum):
 *
 * ```ts
 * const claim = redeem.eth("INSERT_YOUR_ADDRESS", "INSERT_VAA", "w")
 * await signEvm(claim, ethereum)
 * ```
 *
 * Example (Solana):
 *
 * ```ts
 * const claim = await redeem.sol("INSERT_YOUR_ADDRESS", "INSERT_VAA", "w")
 * await signSolanaBundle(claim, solana)
 * ```
 */
export const redeem = {
  eth: (address: string, vaa: string, asset: string) =>
    new EvmClaim().redeem(address, vaa, nttOf(ethereum, asset)),
  base: (address: string, vaa: string, asset: string) =>
    new EvmClaim().redeem(address, vaa, nttOf(base, asset)),
  hydra: (address: string, vaa: string, asset: string) =>
    new EvmClaim().redeem(address, vaa, nttOf(hydration, asset)),
  hydraSub: async (address: string, vaa: string, asset: string) => {
    const claim = await SubstrateClaim.create(hydration);
    return claim.redeem(address, vaa, nttOf(hydration, asset));
  },
  sol: (address: string, vaa: string, asset: string) =>
    new SolanaClaim(solana).redeem(address, vaa, nttOf(solana, asset)),
  sui: (address: string, vaa: string, asset: string) =>
    new SuiClaim(sui).redeem(address, vaa, nttOf(sui, asset)),
};

const vaa =
  'AQAAAAcNAO28l8xDF9LI1Wnos7Jnd8L97/wuctxHlsLbQAXXYA0UaZS77OeKBJ7smiUd0jcUqXZMdXtoOBZ8rzdIp1rrVJ8AA23ELHe1WzNAb0zQXSPCOVVCD0BPEi9wcapRgq9180VEQwhNf74JiJ/1vfoZYik1fgkh8ipXHfAUkG0YFawu77EABNKjws8Xm4x1V+TjmmBdHeKIbg24Jc2ydCkD9TuOG09GAmKzdEb6uj+g9/T7mdPazvHEhYNwENVmVanzsFkm9cMABifQ2AkpjSroelf3ZXmfkLhkaiVA0H44tpN8PpYoAOpKW74PkBhnnYE7ne7jaXYWw7HNh7dpYT8MWOGjcdxeekcBBwBFLbQfHkAjCnh9yECgi471F/1TylPoTPUavoL/04h9Y+wLpMhcHO0NwIYoDTB2qu8b6W4PCn8H4v7+PPXKFasBCCXikK3rA3XWViluXb2i3eCqvYZ8cQ6VNDI3zcnRLOVQLQQvnJFysbuRKkGFBwb4l3yyGVzEfZzLo+BS0bkbWv8BCfacuwN+rSHFYDWHKsIXKfEWXbBsd+F5udpNbFkyKNz2HzVDUoNGTl7kIz5O+3xtRvByMOsJwnwHWbAZKV8OBa8BDBjsQQW5yHdtQ0v8K8lSKPaWiLVQLVDj6G78v37AkQDTLiJy1Vhy6tFbYlPN3kiCdEM0RyE89mQSPG3kHFSWehYBDZc7RCSSrnYGPAzcC9WlZVomlnMws/Bqc7Gog5SO1c2KPVLI6io5r5Y+NWXWnvoPlA73GDS8v2FlfG2LK3641cQBDko+P2Fkw1QgNzCBp/zVhtk6kH5f0vDLgmNQ8cmTOJp6cAC2xNAxgK253npaKzjIoC2tnnbFLW9ZOOlGq3qz6rkAD8yj1OclVe5+m2pLdKN9rz7XGtYWI+BxVkqqi24PcIy1BR8/O1O0Ykhnn4aYdSxFu0I3jIxTKYwbOqlwQSlnUPgBEJq3sYwpXI6a21Dm3oijr+E2YZzZkyHXBEk2wqGZs2wDfo5HauSoBFe8CX+4Y7WK+y36W6QM760bsrXdw5HX8n4AEvQTS4t+AZj9iiTwmGdFzB4uiekoYCBJ+fSKEpDADP1CDhITV8OV9V9fl0m07d5mB7rs9gXcQ3DPed7nOeMa0y0BamuG2wAAAAAAAgAAAAAAAAAAAAAAAJlnOgHFd56/WTmbSyKMGCXAETVxAAAAAAAAAATKmUX/EAAAAAAAAAAAAAAAAIBPEj91zKCpwMujQfgvSk2oalJZAAAAAAAAAAAAAAAAz9V2+IyQhErr9FN4/QmTEoHYsU0AkQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAVT8CIgH6fIjmzBDRxoixV9b6d3UAT5lOVFQIAAAAAAX14QAAAAAAAAAAAAAAAABrF1R06JCUxE2pi5VO7erElScdDwAAAAAAAAAAAAAAAFU/AiIB+nyI5swQ0caIsVfW+nd1AEkAAA==';

const claim = redeem.hydra(
  '0x26f5C2370e563e9f4dDA435f03A63D7C109D8D04',
  vaa,
  'dai_mwh'
);
await signEvm(claim, hydration);
