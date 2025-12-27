import { Abi, EvmChain, Wormhole as Wh } from '@galacticcouncil/xcm-core';

import { encodeFunctionData } from 'viem';

import { encoding } from '@wormhole-foundation/sdk-base';

import { EvmCall } from './types';

export class EvmClaim {
  readonly #chain: EvmChain;

  constructor(chain: EvmChain) {
    this.#chain = chain;
  }

  redeem(from: string, vaaRaw: string): EvmCall {
    const ctxWh = Wh.fromChain(this.#chain);

    const vaaBytes = encoding.b64.decode(vaaRaw);
    const vaaHex = encoding.hex.encode(vaaBytes);

    const abi = Abi.TokenBridge;
    const data = encodeFunctionData({
      abi: abi,
      functionName: 'completeTransfer',
      args: ['0x' + vaaHex],
    });

    return {
      abi: JSON.stringify(abi),
      data: data,
      from: from,
      to: ctxWh.getTokenBridge(),
    } as EvmCall;
  }
}
