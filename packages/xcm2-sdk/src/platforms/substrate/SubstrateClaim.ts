import {
  Abi,
  CallType,
  EvmParachain,
  Precompile,
  Wormhole as Wh,
} from '@galacticcouncil/xcm2-core';

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
    const client = this.#chain.api;
    const api = client.getUnsafeApi();
    const claim = this.redeemMrl(from, vaaBytes);
    const tx = (api.tx as any).EthereumXcm.transact({
      V2: {
        gas_limit: 5_000_000n,
        action: {
          Call: claim.to,
        },
        value: 0n,
        input: claim.data,
      },
    });

    return {
      data: tx.decodedCall,
      from: from,
      type: CallType.Substrate,
      dryRun: async () => undefined,
      txOptions: undefined,
    } as SubstrateCall;
  }
}
