import { ApiPromise } from '@polkadot/api';

import type { PublicClient, ReadContractParameters } from 'viem';

import { encodeFunctionData, decodeFunctionResult } from 'viem';

const GAS_LIMIT = 10_000_000;

export class EvmRpcAdapter {
  private api: ApiPromise;

  constructor(api: ApiPromise) {
    this.api = api;
  }

  async getBlock(): Promise<{ timestamp: bigint; number: bigint }> {
    const block = await this.api.query.ethereum.currentBlock();
    const { header } = block.unwrap();

    const timestamp = header.timestamp.toBigInt() / 1000n;
    const number = header.number.toBigInt();

    return {
      timestamp,
      number,
    };
  }

  public readContract: PublicClient['readContract'] = (async (
    params: ReadContractParameters
  ) => {
    const { abi, address, functionName, args } = params;

    const data = encodeFunctionData({
      abi: abi,
      functionName: functionName,
      args: args,
    });

    const ethereumRpcCallFn = this.api.call.ethereumRuntimeRPCApi.call;
    const ethereumRpcCallParams = ethereumRpcCallFn.meta.params;

    const ethereumRpcCallArgs: [
      string,
      string,
      string,
      number,
      number,
      null,
      null,
      null,
      boolean,
      [],
    ] = [
      '',
      address as string,
      data as string,
      0,
      GAS_LIMIT,
      null,
      null,
      null,
      false,
      [],
    ];

    // Support authorization list (TODO: rebuild spec)
    if (ethereumRpcCallParams.find((p) => p.name === 'authorization_list')) {
      ethereumRpcCallArgs.push([]);
    }

    const res = await ethereumRpcCallFn(...ethereumRpcCallArgs);

    if (res.isErr) {
      console.error(functionName, res.asErr.toHuman());
      throw new Error('Contract read failure');
    }

    const { value, exitReason, usedGas } = res.asOk;
    if (exitReason.isSucceed) {
      return decodeFunctionResult({
        abi: abi,
        functionName: functionName,
        data: value.toHex(),
      });
    }
    console.log(functionName, exitReason.toString(), usedGas.toHuman());
    throw new Error('Contract read error');
  }) as PublicClient['readContract'];
}
