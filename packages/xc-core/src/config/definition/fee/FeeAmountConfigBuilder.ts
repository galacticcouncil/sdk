import { Asset } from '../../../asset';
import { AnyChain } from '../../../chain';

export type FeeAmount = {
  amount: bigint;
  breakdown: { [key: string]: bigint };
};

export interface FeeAmountConfigParams {
  feeAsset: Asset;
  transferAsset: Asset;
  source: AnyChain;
  destination: AnyChain;
  amount?: bigint;
}

export interface FeeAmountConfigBuilder {
  build: (params: FeeAmountConfigParams) => Promise<FeeAmount>;
}
