import {
  Abi,
  addr,
  AnyChain,
  AnyEvmChain,
  ContractConfig,
  ContractConfigBuilder,
  NearChain,
  Ntt as NttRegistry,
  ZecChain,
} from '@galacticcouncil/xc-core';

import { omniClient } from '../../../clients';

const { ZecAddr } = addr;

/** Destination as the emitter takes it: the decoded address, fixed size. */
function destinationOf(chain: AnyChain, address: string): string {
  if (chain instanceof ZecChain) {
    return ZecAddr.getPayload(address);
  }
  throw new Error('No utxo emitter for ' + chain.name);
}

/**
 * Withdrawal to a UTXO chain: `UtxoEmitter.send` on the source.
 *
 * - Settles over ntt to the NEAR account derived from the destination
 *   address, and emits the address beside it
 * - Bots redeem on NEAR and withdraw through Omni's connector; the sender
 *   signs nothing more
 * - Spends the ntt manager's token, approved first
 *
 * @param hub - NEAR chain the transfer settles on
 */
const send = (hub: NearChain): ContractConfigBuilder => ({
  build: async (params) => {
    const { address, amount, asset, source, destination } = params;
    const ctx = source.chain as AnyEvmChain;

    // Decoded first: an invalid address never reaches the derivation
    const payload = destinationOf(destination.chain, address);

    const omni = omniClient(destination.chain, hub);
    const account = await omni.getWithdrawAccount(address);
    const ntt = NttRegistry.fromChain(ctx, asset);

    return [
      new ContractConfig({
        abi: Abi.UtxoEmitter,
        address: omni.connector.withdrawal.emitter,
        args: [amount, payload, '0x' + account],
        func: 'send',
        module: 'UtxoEmitter',
        token: ntt.token,
      }),
    ];
  },
});

export const UtxoEmitter = () => {
  return {
    send,
  };
};
