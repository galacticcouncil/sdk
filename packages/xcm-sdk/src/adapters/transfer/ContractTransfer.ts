import { AssetAmount } from '@moonbeam-network/xcm-types';
import { BaseError } from 'viem';

import { EvmTransfer } from './evm';
import { TransferProvider } from '../types';
import { XCall } from '../../types';

export class ContractTransfer implements TransferProvider<EvmTransfer> {
  calldata(contract: EvmTransfer): XCall {
    console.log(contract);
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
    console.log(contract);

    let fee: bigint;
    try {
      fee = await contract.getFee(account, amount);
    } catch (error) {
      // Can't estimate fee if no allowance
      fee = 0n;
    }

    return feeBalance.copyWith({
      amount: fee,
    });
  }
}
