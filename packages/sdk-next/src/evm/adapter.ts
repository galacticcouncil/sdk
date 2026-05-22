import { Binary, PolkadotClient, SizedHex, TypedApi } from 'polkadot-api';

import { hydration } from '@galacticcouncil/descriptors';

import type { PublicClient, ReadContractParameters } from 'viem';

import { encodeFunctionData, decodeFunctionResult } from 'viem';

import { BlockAt } from '../api';

const GAS_LIMIT = 10_000_000n;

export class EvmRpcAdapter {
  private api: TypedApi<typeof hydration>;
  private at: BlockAt;

  constructor(client: PolkadotClient, at: BlockAt = 'best') {
    this.api = client.getTypedApi(hydration);
    this.at = at;
  }

  async getBlock(): Promise<{ timestamp: bigint; number: bigint }> {
    const block = await this.api.query.Ethereum.CurrentBlock.getValue({
      at: this.at,
    });
    const { header } = block!;

    const timestamp = header.timestamp / 1000n;
    const [blockNumber] = header.number;

    return {
      timestamp,
      number: blockNumber,
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

    const result = await this.api.apis.EthereumRuntimeRPCApi.call(
      '0x0000000000000000000000000000000000000000' as SizedHex<20>,
      address as SizedHex<20>,
      Binary.fromHex(data),
      [0n, 0n, 0n, 0n] as const,
      [GAS_LIMIT, 0n, 0n, 0n] as const,
      undefined,
      undefined,
      undefined,
      false,
      [],
      [],
      { at: this.at }
    );

    if (!result.success) {
      console.error(functionName, result.value.type);
      throw new Error('Contract read failure');
    }

    const { exit_reason, value, used_gas } = result.value;

    // console.log(
    //   functionName,
    //   'Gas: ' + used_gas.standard[0] + ' / ' + used_gas.effective[0]
    // );

    if (exit_reason.type === 'Succeed') {
      return decodeFunctionResult({
        abi: abi,
        functionName: functionName,
        data: Binary.toHex(value) as `0x${string}`,
      });
    }
    console.log(functionName, exit_reason.type, exit_reason.value.type);
    throw new Error('Contract read error');
  }) as PublicClient['readContract'];
}
