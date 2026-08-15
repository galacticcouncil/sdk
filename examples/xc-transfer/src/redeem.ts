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
import { signEvm, signSolanaAll } from 'signers';

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
 * await signSolanaAll(claim, solana)
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
  solRelease: (address: string, vaa: string, asset: string) =>
    new SolanaClaim(solana).release(address, vaa, nttOf(solana, asset)),
  sui: (address: string, vaa: string, asset: string) =>
    new SuiClaim(sui).redeem(address, vaa, nttOf(sui, asset)),
};
