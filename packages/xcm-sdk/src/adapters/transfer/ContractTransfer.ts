import { ContractConfig } from '@moonbeam-network/xcm-builder';
import { AssetAmount } from '@moonbeam-network/xcm-types';

import { EvmTransferFactory } from './evm';
import { TransferProvider } from '../types';
import { XCall } from '../../types';
import { EvmClient, Erc20Client } from '../../evm';

export class ContractTransfer implements TransferProvider<ContractConfig> {
  readonly #client: EvmClient;

  constructor(client: EvmClient) {
    this.#client = client;
  }

  async calldata(account: string, config: ContractConfig): Promise<XCall> {
    const { data, abi, address } = EvmTransferFactory.get(this.#client, config);

    /*     const erc20 = new Erc20Client(this.#client, contract.asset);
    const allowance = await erc20.allowance(account, contract.address);

    if (allowance < contract.amount) {
      console.log('Approve call => Not sufficient allowance!');
      const data = erc20.approve(contract.address, contract.amount);
      return {
        from: account as `0x${string}`,
        data: data as `0x${string}`,
        abi: JSON.stringify(erc20.abi),
        to: contract.asset,
      } as XCall;
    } */

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
    config: ContractConfig
  ): Promise<AssetAmount> {
    console.log(config);
    const contract = EvmTransferFactory.get(this.#client, config);

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
