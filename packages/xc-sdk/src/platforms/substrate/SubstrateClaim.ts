import { EvmParachain, NttTokenDef } from '@galacticcouncil/xc-core';

import { EvmClaim } from '../evm/EvmClaim';

import { Gas, SubstrateEvm } from './SubstrateEvm';
import { SubstrateCall } from './types';

/**
 * NTT claim for substrate signed origins.
 *
 * Wraps the evm claim calls in EVM.call extrinsic so bound substrate
 * accounts can redeem without an evm signer.
 */
export class SubstrateClaim {
  readonly #substrateEvm: SubstrateEvm;
  readonly #evmClaim = new EvmClaim();

  private constructor(substrateEvm: SubstrateEvm) {
    this.#substrateEvm = substrateEvm;
  }

  static async create(chain: EvmParachain): Promise<SubstrateClaim> {
    const substrateEvm = await SubstrateEvm.create(chain);
    return new SubstrateClaim(substrateEvm);
  }

  /**
   * Redeem NTT transfer (see {@link EvmClaim.redeem}).
   *
   * @param from - claimer address (ss58)
   * @param vaaRaw - base64 encoded signed VAA (wormholescan raw format)
   * @param ntt - NTT token deployment on the destination chain
   * @returns claim (receiveMessage) substrate call
   */
  async redeem(
    from: string,
    vaaRaw: string,
    ntt: NttTokenDef
  ): Promise<SubstrateCall> {
    const call = this.#evmClaim.redeem(from, vaaRaw, ntt);
    return this.#substrateEvm.buildCall(from, [
      {
        to: call.to,
        data: call.data,
        gas: Gas.redeem,
      },
    ]);
  }

  /**
   * Complete an inbound transfer queued by the manager rate limit
   * (see {@link EvmClaim.completeInboundQueuedTransfer}).
   *
   * @param from - claimer address (ss58)
   * @param digest - queued transfer message digest
   * @param ntt - NTT token deployment on the destination chain
   * @returns complete transfer substrate call
   */
  async completeInboundQueuedTransfer(
    from: string,
    digest: string,
    ntt: NttTokenDef
  ): Promise<SubstrateCall> {
    const call = this.#evmClaim.completeInboundQueuedTransfer(
      from,
      digest,
      ntt
    );
    return this.#substrateEvm.buildCall(from, [
      {
        to: call.to,
        data: call.data,
        gas: Gas.queued,
      },
    ]);
  }
}
