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
