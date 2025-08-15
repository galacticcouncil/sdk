import {
  Abi,
  AnyChain,
  AnyEvmChain,
  Precompile,
  Wormhole,
} from '@galacticcouncil/xcm-core';

import { encoding } from '@wormhole-foundation/sdk-base';
import { keccak256 } from '@wormhole-foundation/sdk-connect';
import { deserialize } from '@wormhole-foundation/sdk-definitions';

import { encodeFunctionData } from 'viem';

import { EvmCall } from '../platforms';

export class WormholeClient {
  getVaaHeader(vaaHex: string) {
    const vaaBytes = encoding.b64.decode(vaaHex);
    const vaa = deserialize('Uint8Array', vaaBytes);
    return {
      timestamp: vaa.timestamp,
      emitterChain: vaa.emitterChain,
      emitterAddress: vaa.emitterAddress.toString(),
      sequence: vaa.sequence,
      payload: vaa.payload,
      hash: vaa.hash,
      id: keccak256(vaa.hash),
    };
  }

  async isTransferCompleted(chain: AnyChain, vaaHex: string): Promise<boolean> {
    const ctx = chain as AnyEvmChain;
    const ctxWh = ctx.wormhole as Wormhole;
    const provider = ctx.client.getProvider();
    const tokenBridge = ctxWh.getTokenBridge();

    const vaaArray = encoding.b64.decode(vaaHex);
    const vaaArrayDes = deserialize('Uint8Array', vaaArray);
    const vaaDigestArray = keccak256(vaaArrayDes.hash);
    const vaaDigest = encoding.hex.encode(vaaDigestArray);

    const payload = await provider.readContract({
      address: tokenBridge as `0x${string}`,
      abi: Abi.TokenBridge,
      functionName: 'isTransferCompleted',
      args: ['0x' + vaaDigest],
    });
    return payload as boolean;
  }

  redeem(chain: AnyChain, from: string, vaaBytes: string): EvmCall {
    const ctx = chain as AnyEvmChain;
    const ctxWh = ctx.wormhole as Wormhole;
    const vaaArray = encoding.b64.decode(vaaBytes);
    const vaaHex = encoding.hex.encode(vaaArray);

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
}
