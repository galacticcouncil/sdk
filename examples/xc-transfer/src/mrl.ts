import { EvmCall, SubstrateClaim } from '@galacticcouncil/xc-sdk';
import { ctx } from './setup';
import { EvmParachain } from '@galacticcouncil/xc-core';

const { config } = ctx;

const moonbeam = config.getChain('moonbeam') as EvmParachain;

const claim = new SubstrateClaim(moonbeam);

export function redeem(address: string, vaa: string): EvmCall {
  return claim.redeemMrl(address, vaa);
}
