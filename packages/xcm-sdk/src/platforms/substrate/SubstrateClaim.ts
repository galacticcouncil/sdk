import {
  Abi,
  EvmParachain,
  Precompile,
  Wormhole as Wh,
} from '@galacticcouncil/xcm-core';

import { encoding } from '@wormhole-foundation/sdk-base';

import { encodeFunctionData } from 'viem';

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
    const api = await this.#chain.api;
    const claim = this.redeemMrl(from, vaaBytes);
    const tx = api.tx.ethereumXcm.transact({
      ['V2']: {
        gasLimit: 5_000_000n,
        action: {
          Call: claim.to,
        },
        value: 0n,
        input: claim.data,
      },
    });

    return {
      data: tx.toHex(),
      from: from,
    } as SubstrateCall;
  }
}
