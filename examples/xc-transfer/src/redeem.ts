import {
  EvmCall,
  EvmClaim,
  SolanaCall,
  SolanaClaim,
  SubstrateClaim,
} from '@galacticcouncil/xc-sdk';
import { EvmChain, EvmParachain, SolanaChain } from '@galacticcouncil/xc-core';

import { ctx } from './setup';
import { signSolanaBundle } from './signers';

const { config } = ctx;

const moonbeam = config.getChain('moonbeam') as EvmParachain;
const ethereum = config.getChain('ethereum') as EvmChain;
const solana = config.getChain('solana') as SolanaChain;

const claimSol = new SolanaClaim(solana);
const claimMrl = new SubstrateClaim(moonbeam);
const claim = new EvmClaim(ethereum);

export function redeemMrl(address: string, vaa: string): EvmCall {
  return claimMrl.redeemMrl(address, vaa);
}

export async function redeemSol(
  address: string,
  vaa: string
): Promise<SolanaCall[]> {
  return claimSol.redeem(address, vaa);
}

export function redeemEvm(address: string, vaa: string): EvmCall {
  return claim.redeem(address, vaa);
}

// redeem and sign
