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
    const extrinic = this.#substrate.buildExtrinsic(config);
    return {
      data: extrinic.inner.toHex(),
    } as XCall;
  }

  async getFee(
    account: string,
    amount: bigint,
    feeBalance: AssetAmount,
    config: ExtrinsicConfig
  ): Promise<AssetAmount> {
    const fee = await this.#substrate.getFee(account, config);
    return feeBalance.copyWith({
      amount: fee,
    });
  }
}
