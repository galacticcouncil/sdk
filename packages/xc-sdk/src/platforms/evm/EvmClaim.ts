import { Abi, NttTokenDef } from '@galacticcouncil/xc-core';

import { encodeFunctionData } from 'viem';

import { encoding } from '@wormhole-foundation/sdk-base';

import { EvmCall } from './types';

export class EvmClaim {
  /**
   * Redeem NTT transfer on destination chain.
   *
   * Delivers the signed VAA to the token transceiver which verifies the
   * attestation and instructs the manager to mint (or unlock) the tokens.
   *
   * @param from - claimer address
   * @param vaaRaw - base64 encoded signed VAA (wormholescan raw format)
   * @param ntt - NTT token deployment on the destination chain
   * @returns claim (receiveMessage) evm call
   */
  redeem(from: string, vaaRaw: string, ntt: NttTokenDef): EvmCall {
    const vaaBytes = encoding.b64.decode(vaaRaw);
    const vaaHex = encoding.hex.encode(vaaBytes);

    const abi = Abi.WormholeTransceiver;
    const data = encodeFunctionData({
      abi: abi,
      functionName: 'receiveMessage',
      args: ['0x' + vaaHex],
    });

    return {
      abi: JSON.stringify(abi),
      data: data,
      from: from,
      to: ntt.transceiver.wormhole,
    } as EvmCall;
  }

  /**
   * Complete an inbound transfer queued by the manager rate limit.
   *
   * Callable once the rate limit duration expired for a transfer that
   * was delivered (redeemed) while the inbound limit was exhausted.
   *
   * @param from - claimer address
   * @param digest - queued transfer message digest
   * @param ntt - NTT token deployment on the destination chain
   * @returns complete transfer evm call
   */
  completeInboundQueuedTransfer(
    from: string,
    digest: string,
    ntt: NttTokenDef
  ): EvmCall {
    const abi = Abi.NttManager;
    const data = encodeFunctionData({
      abi: abi,
      functionName: 'completeInboundQueuedTransfer',
      args: [digest],
    });

    return {
      abi: JSON.stringify(abi),
      data: data,
      from: from,
      to: ntt.manager,
    } as EvmCall;
  }
}
