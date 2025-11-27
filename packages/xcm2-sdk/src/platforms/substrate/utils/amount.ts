import { Asset, AssetAmountParams } from '@galacticcouncil/xcm2-core';
import { big } from '@galacticcouncil/common';

import { SubstrateService } from '../SubstrateService';

/**
 * Normalize asset amount if chain uses solely chain decimals
 * for balance representation of assets.
 *
 * @param amount - original chain amount
 * @param asset - asset
 * @param substrate - source chain substrate service
 * @returns normalized asset amount if chain decimals used, otherwise default
 */
export async function normalizeAssetAmount(
  amount: bigint,
  asset: Asset,
  substrate: SubstrateService
): Promise<AssetAmountParams> {
  const chainDecimals = await substrate.getDecimals();
  const assetDecimals = substrate.chain.getAssetDecimals(asset) ?? chainDecimals;
  const normDecimals = substrate.chain.usesChainDecimals
    ? chainDecimals
    : assetDecimals;
  const normBalance = big.convertDecimals(amount, normDecimals, assetDecimals);
  return {
    amount: normBalance,
    decimals: assetDecimals,
  };
}
