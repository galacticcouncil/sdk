import {
  AnyParachain,
  AssetAmount,
  ExtrinsicConfig,
} from '@galacticcouncil/xcm-core';

import { TransferProvider } from '../types';
import { SubstrateService, normalizeAssetAmount } from '../../substrate';
import { XCall } from '../../types';

export class SubstrateTransfer implements TransferProvider<ExtrinsicConfig> {
  readonly #substrate: Promise<SubstrateService>;

  constructor(chain: AnyParachain) {
    this.#substrate = SubstrateService.create(chain);
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
    } catch {
      // Can't estimate fee if transferMultiasset with no balance
      fee = 0n;
    }
    const params = normalizeAssetAmount(fee, feeBalance, substrate);
    return feeBalance.copyWith(params);
  }
}
