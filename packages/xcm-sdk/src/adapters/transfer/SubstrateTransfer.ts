import {
  AnyParachain,
  AssetAmount,
  ExtrinsicConfig,
} from '@galacticcouncil/xcm-core';

import { TransferProvider } from '../types';
import { SubstrateService, normalizeAssetAmount } from '../../substrate';
import { XCall } from '../../types';
import { Dex } from '../../Dex';

export class SubstrateTransfer implements TransferProvider<ExtrinsicConfig> {
  readonly #substrate: Promise<SubstrateService>;
  readonly #dex: Dex;

  constructor(chain: AnyParachain, dex: Dex) {
    this.#substrate = SubstrateService.create(chain);
    this.#dex = dex;
  }

  async calldata(
    account: string,
    amount: bigint,
    config: ExtrinsicConfig
  ): Promise<XCall> {
    const substrate = await this.#substrate;
    const extrinsic = substrate.getExtrinsic(config);
    return {
      from: account,
      data: extrinsic.toHex(),
    } as XCall;
  }

  async estimateFee(
    account: string,
    amount: bigint,
    feeBalance: AssetAmount,
    config: ExtrinsicConfig
  ): Promise<AssetAmount> {
    const substrate = await this.#substrate;
    let fee: bigint;
    try {
      fee = await substrate.estimateFee(account, config);
      fee = await this.exchangeFee(fee, feeBalance);
    } catch (e) {
      // Can't estimate fee if transferMultiasset with no balance
      fee = 0n;
    }
    const params = normalizeAssetAmount(fee, feeBalance, substrate);
    return feeBalance.copyWith(params);
  }

  /**
   * Display native fee in user preferred fee payment asset (dex only)
   *
   * @param fee - native fee
   * @param feeBalance - native fee balance
   * @returns - fee in user preferred payment asset
   */
  async exchangeFee(fee: bigint, feeBalance: AssetAmount): Promise<bigint> {
    const { asset, decimals, chain } = await this.#substrate;
    if (chain.parachainId === this.#dex.chain.parachainId) {
      const amountIn = Number(fee) / 10 ** decimals;
      const assetIn = chain.getMetadataAssetId(asset);
      const assetOut = chain.getMetadataAssetId(feeBalance);

      if (assetIn !== assetOut) {
        const { amountOut } = await this.#dex.router.getBestSell(
          assetIn.toString(),
          assetOut.toString(),
          amountIn
        );
        return BigInt(amountOut.toNumber());
      }
    }
    return fee;
  }
}
