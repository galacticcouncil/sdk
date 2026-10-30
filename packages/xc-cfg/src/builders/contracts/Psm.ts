import {
  Abi,
  ContractConfig,
  ContractConfigBuilder,
} from '@galacticcouncil/xc-core';
import { big, h160 } from '@galacticcouncil/common';

import { pad, zeroHash } from 'viem';

import { PSM_CORRIDORS } from '../../bridges/psm';
import { parseAssetId } from '../utils';

const { H160 } = h160;

/** Seconds a built redeem stays valid, time in review included. */
const REDEEM_TTL = 3600;

/**
 * PSM deposit: `HollarBaseVault.deposit` on the source.
 *
 * - Recipient is the account's h160, left-padded to bytes32
 * - Hydration credits erc20s by that h160, bound or not
 * - Source usdc is approved to the vault first
 * - No call value, the wormhole message fee is 0
 */
const deposit = (): ContractConfigBuilder => ({
  build: async (params) => {
    const { address, amount, asset, source } = params;

    const ctx = source.chain;
    const psm = PSM_CORRIDORS[ctx.key];
    if (!psm) {
      throw new Error(ctx.name + ' is not supported in PSM.');
    }

    const recipient = pad(H160.fromAny(address) as `0x${string}`, {
      size: 32,
    });

    const assetId = ctx.getAssetId(asset);
    return [
      new ContractConfig({
        abi: Abi.HollarBaseVault,
        address: psm.vault,
        args: [amount, recipient],
        func: 'deposit',
        module: 'HollarBaseVault',
        token: parseAssetId(assetId) as string,
      }),
    ];
  },
});

/**
 * PSM redeem: `HollarBaseFacilitator.redeem` on hydration.
 *
 * - Burns the amount floored to usdc units, the dust stays
 * - Recipient is the evm address as given, never derived
 * - Fee cap is the quoted fee, a later raise returns the HOLLAR
 * - HOLLAR is approved to the facilitator first
 * - No call value, the wormhole message fee is 0
 */
const redeem = (): ContractConfigBuilder => ({
  build: async (params) => {
    const { address, amount, asset, destination, source } = params;

    const ctx = source.chain;
    const psm = PSM_CORRIDORS[destination.chain.key];
    if (!psm) {
      throw new Error(destination.chain.name + ' is not supported in PSM.');
    }

    const usdcAmount = big.convertDecimals(
      amount,
      source.balance.decimals,
      destination.balance.decimals
    );
    const maxFeeBps = destination.feeBreakdown['redeemFeeBps'];
    const deadline = BigInt(Math.floor(Date.now() / 1000) + REDEEM_TTL);

    const assetId = ctx.getBalanceAssetId(asset);
    return [
      new ContractConfig({
        abi: Abi.HollarBaseFacilitator,
        address: psm.facilitator,
        args: [usdcAmount, address, maxFeeBps, deadline, zeroHash],
        func: 'redeem',
        module: 'HollarBaseFacilitator',
        token: parseAssetId(assetId) as string,
      }),
    ];
  },
});

export const Psm = () => {
  return {
    deposit,
    redeem,
  };
};
