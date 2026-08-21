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
  /** Asset the transfer lands as, when it differs from {@link transferAsset} */
  destinationAsset?: Asset;
  /**
   * Recipient on the destination.
   *
   * For a fee whose size depends on the accounts the delivery has to open -
   * an svm redeem opening the recipient's ata - so it must be the same value
   * the transfer is later built with.
   */
  address?: string;
}

export interface FeeAmountConfigBuilder {
  build: (params: FeeAmountConfigParams) => Promise<FeeAmount>;
}
