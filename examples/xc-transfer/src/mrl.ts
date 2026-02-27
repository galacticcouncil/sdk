import { EvmCall, EvmClaim, SubstrateClaim } from '@galacticcouncil/xc-sdk';
import { EvmChain, EvmParachain } from '@galacticcouncil/xc-core';

import { ctx } from './setup';

const { config } = ctx;

const moonbeam = config.getChain('moonbeam') as EvmParachain;
const ethereum = config.getChain('ethereum') as EvmChain;

const claimMrl = new SubstrateClaim(moonbeam);
const claim = new EvmClaim(ethereum);

export function redeemMrl(address: string, vaa: string): EvmCall {
  return claimMrl.redeemMrl(address, vaa);
}

export function redeem(address: string, vaa: string): EvmCall {
  return claim.redeem(address, vaa);
}
