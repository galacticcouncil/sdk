import {
  AssetConfig,
  AssetConfigConstructorParams,
} from '@moonbeam-network/xcm-config';

import { ExtrinsicConfigBuilderV2 } from './ExtrinsicConfig';

export interface AssetConfigConstructorParamsV2
  extends AssetConfigConstructorParams {
  ethereum?: ExtrinsicConfigBuilderV2;
  extrinsicV2?: ExtrinsicConfigBuilderV2;
}

export class AssetConfigV2 extends AssetConfig {
  readonly ethereum?: ExtrinsicConfigBuilderV2;
  readonly extrinsicV2?: ExtrinsicConfigBuilderV2;

  constructor({
    asset,
    balance,
    contract,
    destination,
    destinationFee,
    ethereum,
    extrinsic,
    extrinsicV2,
    fee,
    min,
  }: AssetConfigConstructorParamsV2) {
    super({
      asset,
      balance,
      contract,
      destination,
      destinationFee,
      extrinsic,
      fee,
      min,
    });
    this.ethereum = ethereum;
    this.extrinsicV2 = extrinsicV2;
  }
}
