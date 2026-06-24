import {
  EvmClaim,
  SolanaClaim,
  SubstrateClaim,
  SuiClaim,
} from '@galacticcouncil/xc-sdk';
import {
  EvmChain,
  EvmParachain,
  SolanaChain,
  SuiChain,
} from '@galacticcouncil/xc-core';

import { xc } from './setup';
import { signSolanaBundle, signSui, signEvm } from './signers';

const { config } = xc;

const moonbeam = config.getChain('moonbeam') as EvmParachain;
const ethereum = config.getChain('ethereum') as EvmChain;
const base = config.getChain('base') as EvmChain;
const solana = config.getChain('solana') as SolanaChain;
const sui = config.getChain('sui') as SuiChain;

const solanaClaim = new SolanaClaim(solana);
const mrlClaim = new SubstrateClaim(moonbeam);
const suiClaim = new SuiClaim(sui);
const ethereumClaim = new EvmClaim(ethereum);
const baseClaim = new EvmClaim(base);

/**
 * Helpers for redeeming a Wormhole VAA on different chains.
 *
 * Each function builds the transaction call(s) required to redeem
 * the transfer on the target chain. The returned call must then be
 * signed and submitted with the appropriate signer.
 *
 * Example (Solana):
 *
 * ```ts
 * const claim = await redeem.sol("INSERT_YOUR_ADDRESS", "INSERT_VAA")
 * await signSolanaBundle(claim, solana)
 * ```
 *
 * Example (Ethereum):
 *
 * ```ts
 * const claim = redeem.eth("INSERT_YOUR_ADDRESS", "INSERT_VAA")
 * await signEvm(claim, ethereum)
 * ```
 */
export const redeem = {
  mrl: (address: string, vaa: string) => mrlClaim.redeemMrl(address, vaa),
  sol: (address: string, vaa: string) => solanaClaim.redeem(address, vaa),
  sui: (address: string, vaa: string) => suiClaim.redeem(address, vaa),
  eth: (address: string, vaa: string) => ethereumClaim.redeem(address, vaa),
  base: (address: string, vaa: string) => baseClaim.redeem(address, vaa),
};

const vaa =
  'AQAAAAYNACxQrtONNFw8HKJLhQv3X6A8w/1iQdtJgfLkcMeEneE5aqPp+IO/DfDl0eHTVpuyY7EKE/Xq/fsh40Fj1CN+MD8AAnRs5MvvFf8S7fGgNcmLD/lNNUXsfUhuouMDFKtbcSk0VIQZJ3S+pEpKGUJh8qjx1SQP1kukVEEaNFoU6MKf+qwAA/uwg4c+ceSq6jWgsj5EDKEVvbm6a9jNDCG8xojlfj3ySr6z3BE+sjUL/8i+AdqrDYw30q70S7VZyqM/otnAe7wABEVy8OUA3qKY4/06EOKlA4OD/u3xP/I1px+fLFeHyB3NVYGEIe7aF0LcDxN4c9k4JeKMnZ5M4l8vrrjVC/R1T84ABQAcHFqe9dNgSwXCj0FaOSFAo3mhyNY38o4ik1z3dQCNV3Sb/VjSa4xMuPLAafW7QUE67BaIKtEi0PaQBnZvrLgABku0cHQOXuwDeAABNrAm/5U6h+/FJbk7khTjC1OnrapsWYMIMx7lXlShCm1nEM7ZjCn2t9niuLIfK3+OGuKHUgMBCGmr/DrFs9Sob0TV6E+uerWu0yT/RmR6Qv56qmQqAbRiOa4gOfdaCb5ySlTyvu64C9BGiJjo39zipEB9lQbSKhYACvrYIhHHSPl/yl/WX8seevU4r3Ag2k0VPIGmGMgTqd/HDzCff6c+JlRZEEWXYVdXZRvL5BcrFfwBfjvVWqfJZCMBCwHcGA2GPZNPAl/eIdkxScOQXmqqgz+szv5ZvVYt5H2jZId8vFrD7vlvsAiFZATVL/+ZEhICt+NvViGz9Ds9olQBDZ8wx4XxWNYESPXolIQEAfvID6U6XsB5yFjWRY06CdH7TjJrknKGV1+U0mZ5+CeUTqJdVCmpoG7k12k0RDsl97oBEPrwZWkZxW3pRTYuxcBWwXH9qoqmYf8iNBRg878Ztkf9IRAKIbma/A/rH6lkdFCb9uPuYuPhvQrnhbTKN/UULuEAESFD2VKc76zcW6Ws4wcood2128VctX5IIuTENYj1jwvtReSWItZAmfmktTs+k5Nva1/qQlkDHs9r6t40Jxb5UqwBEtiwsx+6F4hxwnZ94NB+5sf4f8hCOit/uhAptqHr+tLqSYsVsIIYbdvh80WPgOezK9LlVUGqT+SoYuLhP8DJWG8Bajt+eAAAAAAAEAAAAAAAAAAAAAAAALFzHFhsqJojgJhhxhA/C5az9X2SAAAAAAABeRQBAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPZzAAAAAAAAAAAAAAAAwCqqObIj/o0KDlxPJ+rZCDx1bMIAAgAAAAAAAAAAAAAAAPGl/kJS2aHDmw+53h8ZBJ7lftGIAAIAAAAAAAAAAAAAAAC0dVUKMYOy3J3mXwYU40Lft8668lHRjFe+mseAMFkNOGU8a1YX/wnH4IJ7u64YaPwJYoesAAAAAAAAAAAAAAAApyDzsuTnn7fOB15o395WQKj+2pIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB6TXaRigA==';

const call = redeem.eth('0x26f5C2370e563e9f4dDA435f03A63D7C109D8D04', vaa);

signEvm(call, ethereum);
