import { AssetAmount } from '@moonbeam-network/xcm-types';

import { EvmTransfer } from './evm';
import { TransferProvider } from '../types';
import { XCall } from '../../types';

import { EvmClient, Erc20Client } from '../../evm';

export class EvmTransferProvider implements TransferProvider<EvmTransfer> {
  readonly #client: EvmClient;

  constructor(client: EvmClient) {
    this.#client = client;
  }

  async calldata(account: string, contract: EvmTransfer): Promise<XCall> {
    const erc20 = new Erc20Client(this.#client, contract.asset);
    erc20.allowance(account, contract.address);

    const { data, abi, address } = contract;
    return {
      from: account as `0x${string}`,
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
