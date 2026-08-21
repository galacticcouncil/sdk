import { big } from '@galacticcouncil/common';

import { Asset, AssetAmountParams } from '../../asset';

import type { AnyParachain } from '../types';

/**
 * Normalize asset amount if chain uses solely chain decimals for balance
 * representation of assets.
 */
export async function normalizeAssetAmount(
  amount: bigint,
  asset: Asset,
  chain: AnyParachain
): Promise<AssetAmountParams> {
  const { decimals: chainDecimals } = await chain.getCurrency();
  const assetDecimals = chain.getAssetDecimals(asset) ?? chainDecimals;
  const normDecimals = chain.usesChainDecimals ? chainDecimals : assetDecimals;
  const normBalance = big.convertDecimals(amount, normDecimals, assetDecimals);
  return {
    amount: normBalance,
    decimals: assetDecimals,
  };
}
