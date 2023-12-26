import { ExtrinsicConfig } from '@moonbeam-network/xcm-builder';
import { AssetAmount } from '@moonbeam-network/xcm-types';

import { SubstrateService } from '../../substrate';
import { XCall } from '../../types';

import { TransferProvider } from '../types';

export class ExtrinsicTransfer implements TransferProvider<ExtrinsicConfig> {
  readonly #substrate: SubstrateService;

  constructor(substrate: SubstrateService) {
    this.#substrate = substrate;
  }

  calldata(config: ExtrinsicConfig): XCall {
    const extrinic = this.#substrate.getExtrinsic(config);
    return {
      data: extrinic.toHex(),
    } as XCall;
  }

  async getFee(
    account: string,
    amount: bigint,
    feeBalance: AssetAmount,
    config: ExtrinsicConfig
  ): Promise<AssetAmount> {
    let fee: bigint;
    try {
      fee = await this.#substrate.getFee(account, config);
    } catch {
      // Can't estimate fee if transferMultiasset with no balance
      fee = 0n;
    }
    return feeBalance.copyWith({
      amount: fee,
    });
  }
}
