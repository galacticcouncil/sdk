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

import { config } from '../setup';

export const moonbeam = config.getChain('moonbeam') as EvmParachain;
export const ethereum = config.getChain('ethereum') as EvmChain;
export const base = config.getChain('base') as EvmChain;
export const solana = config.getChain('solana') as SolanaChain;
export const sui = config.getChain('sui') as SuiChain;

const solanaClaim = new SolanaClaim(solana);
const mrlClaim = new SubstrateClaim(moonbeam);
const suiClaim = new SuiClaim(sui);
const ethereumClaim = new EvmClaim(ethereum);
const baseClaim = new EvmClaim(base);

export const redeem = {
  mrl: (address: string, vaa: string) => mrlClaim.redeemMrl(address, vaa),
  sol: (address: string, vaa: string) => solanaClaim.redeem(address, vaa),
  sui: (address: string, vaa: string) => suiClaim.redeem(address, vaa),
  eth: (address: string, vaa: string) => ethereumClaim.redeem(address, vaa),
  base: (address: string, vaa: string) => baseClaim.redeem(address, vaa),
};
