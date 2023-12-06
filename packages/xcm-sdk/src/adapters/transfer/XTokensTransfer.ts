import { AssetAmount } from '@moonbeam-network/xcm-types';

import { XTokens } from '../../contracts';
import { XCall } from '../../types';

import { TransferProvider } from '../types';

export class XTokensTransfer implements TransferProvider<XTokens> {
  calldata(contract: XTokens): XCall {
    const { data, abi, address } = contract;
    return {
      data: data as `0x${string}`,
      abi: abi,
      to: address,
    } as XCall;
  }

  async getFee(
    account: string,
    amount: bigint,
    feeBalance: AssetAmount,
    contract: XTokens,
  ): Promise<AssetAmount> {
    const fee = await contract.getFee(account, amount);
    return feeBalance.copyWith({
      amount: fee,
    });
  }
}
