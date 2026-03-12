import {
  Abi,
  CallType,
  EvmParachain,
  Precompile,
  Wormhole as Wh,
} from '@galacticcouncil/xc-core';

import { encoding } from '@wormhole-foundation/sdk-base';

import { encodeFunctionData } from 'viem';

import { Binary } from 'polkadot-api';

import { SubstrateCall } from './types';
import { EvmCall } from '../evm';

export class SubstrateClaim {
  readonly #chain: EvmParachain;

  constructor(chain: EvmParachain) {
    this.#chain = chain;
    Wh.fromChain(this.#chain);
  }

  redeemMrl(from: string, vaaBytes: string): EvmCall {
    const vaaArray = encoding.b64.decode(vaaBytes);
    const vaaHex = encoding.hex.encode(vaaArray);

    const abi = Abi.Gmp;
    const data = encodeFunctionData({
      abi: abi,
      functionName: 'wormholeTransferERC20',
      args: ['0x' + vaaHex],
    });
    return {
      abi: JSON.stringify(abi),
      data: data,
      from: from,
      to: Precompile.Bridge,
    } as EvmCall;
  }

  async redeemMrlViaXcm(
    from: string,
    vaaBytes: string
  ): Promise<SubstrateCall> {
    const client = this.#chain.client;
    const api = client.getUnsafeApi();
    const claim = this.redeemMrl(from, vaaBytes);
    const tx = (api.tx as any).EthereumXcm.transact({
      xcm_transaction: {
        type: 'V2',
        value: {
          gas_limit: [5_000_000n, 0n, 0n, 0n],
          fee_payment: {
            type: 'Auto',
            value: undefined,
          },
          action: {
            type: 'Call',
            value: Binary.fromHex(claim.to),
          },
          value: [0n, 0n, 0n, 0n],
          input: Binary.fromHex(claim.data),
          access_list: undefined,
        },
      },
    });

    const encoded = await tx.getEncodedData();
    return {
      data: encoded.asHex(),
      from: from,
      type: CallType.Substrate,
      dryRun: async () => undefined,
      txOptions: undefined,
    } as SubstrateCall;
  }
}
