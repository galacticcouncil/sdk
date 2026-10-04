import {
  NearChain,
  NearDeposit,
  NearGas,
  NttTokenDef,
} from '@galacticcouncil/xc-core';

import { encoding } from '@wormhole-foundation/sdk-base';
import {
  deserialize,
  UniversalAddress,
} from '@wormhole-foundation/sdk-definitions';
import {
  Ntt,
  register as registerNttPayloads,
} from '@wormhole-foundation/sdk-definitions-ntt';

import { NearCall } from './types';
import { toNearCall } from './utils';

function parseVaa(vaaRaw: string) {
  // The ntt payload layouts stopped registering on import in 7.x, they are
  // opt-in now - `deserialize` throws without this. Idempotent.
  registerNttPayloads();
  return deserialize('Ntt:WormholeTransfer', encoding.b64.decode(vaaRaw));
}

export class NearClaim {
  readonly #chain: NearChain;

  constructor(chain: NearChain) {
    this.#chain = chain;
  }

  /**
   * Redeem NTT transfer on NEAR.
   *
   * - Anyone may submit it, the tokens go to the account the vaa names
   * - The vaa names that account by its sha256 only, so it is passed in plain
   *   and checked against the hash here
   * - A first time recipient is registered on the token out of the deposit,
   *   the rest is refunded
   *
   * @param from - payer
   * @param vaaRaw - base64 encoded signed VAA (wormholescan raw format)
   * @param ntt - NTT token deployment on NEAR
   * @param recipient - account the vaa pays out to, the payer by default
   * @returns claim (complete) call
   */
  redeem(
    from: string,
    vaaRaw: string,
    ntt: NttTokenDef,
    recipient: string = from
  ): NearCall {
    const vaa = parseVaa(vaaRaw);
    const { recipientAddress } = vaa.payload.nttManagerPayload.payload;
    if (!recipientAddress.equals(new UniversalAddress(recipient, 'sha256'))) {
      throw new Error(
        'Vaa pays out to ' + recipientAddress.toString() + ', not ' + recipient
      );
    }

    return toNearCall(from, ntt.manager, [
      {
        methodName: 'complete',
        args: {
          vaa: encoding.hex.encode(encoding.b64.decode(vaaRaw)),
          account_id: recipient,
        },
        gas: NearGas.complete,
        deposit: NearDeposit.complete,
      },
    ]);
  }

  /**
   * Complete an inbound transfer queued by the contract rate limit.
   *
   * Callable by anyone once 24h passed since the transfer was redeemed
   * while the inbound limit was exhausted.
   *
   * @param from - claimer address
   * @param digest - queued transfer message digest
   * @param ntt - NTT token deployment on NEAR
   * @returns release inbound call
   */
  completeInboundQueuedTransfer(
    from: string,
    digest: string,
    ntt: NttTokenDef
  ): NearCall {
    return toNearCall(from, ntt.manager, [
      {
        methodName: 'release_inbound',
        args: { digest },
        gas: NearGas.payOut,
        deposit: 0n,
      },
    ]);
  }

  /**
   * Pay out what failed pay outs credited the signer - an unlock or a refund
   * whose ft_transfer failed.
   *
   * @param from - account to pay out
   * @param ntt - NTT token deployment on NEAR
   * @returns claim call
   */
  claim(from: string, ntt: NttTokenDef): NearCall {
    return toNearCall(from, ntt.manager, [
      {
        methodName: 'claim',
        args: {},
        gas: NearGas.payOut,
        deposit: NearDeposit.oneYocto,
      },
    ]);
  }

  /**
   * Whether the contract already executed the transfer.
   *
   * - Replay is keyed by the ntt message digest, not the vaa hash
   * - A transfer queued by the rate limit reads as executed
   *
   * @param vaaRaw - base64 encoded signed VAA (wormholescan raw format)
   * @param ntt - NTT token deployment on NEAR
   */
  isRedeemed(vaaRaw: string, ntt: NttTokenDef): Promise<boolean> {
    const vaa = parseVaa(vaaRaw);
    const digest = Ntt.messageDigest(
      vaa.emitterChain,
      vaa.payload.nttManagerPayload
    );
    return this.#chain.client.view<boolean>(ntt.manager, 'is_executed', {
      digest: encoding.hex.encode(digest),
    });
  }
}
