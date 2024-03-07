import { AssetAmount } from '@moonbeam-network/xcm-types';

import { EvmTransfer } from './evm';
import { XCall } from '../../types';

import { TransferProvider } from '../types';

export class ContractTransfer implements TransferProvider<EvmTransfer> {
  calldata(contract: EvmTransfer): XCall {
    const { data, abi, address } = contract;
    return {
      data: data as `0x${string}`,
      abi: JSON.stringify(abi),
      to: address,
    } as XCall;
  }

  async getFee(
    account: string,
    amount: bigint,
    feeBalance: AssetAmount,
    contract: EvmTransfer
  ): Promise<AssetAmount> {
    const fee = await contract.getFee(account, amount);
    return feeBalance.copyWith({
      amount: fee,
    });
  }
}
