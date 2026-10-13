import {
  AnyChain,
  CallType,
  NearChain,
  Ntt as NttRegistry,
  OmniUtxoChain,
  PaymentConfig,
  PaymentConfigBuilder,
  ZecChain,
} from '@galacticcouncil/xc-core';

import { getOmniClient, OMNI_UTXO_CHAINS } from '../../../bridges/omni';
import { getNearTransferMsg } from '../../../bridges/wormhole';

/** Platform signing a payment on the source chain. */
function callTypeOf(chain: AnyChain): CallType {
  if (chain instanceof ZecChain) {
    return CallType.Zec;
  }
  throw new Error('No payment platform for ' + chain.name);
}

/** Omni's name of the source chain. */
function omniChainOf(chain: AnyChain): OmniUtxoChain {
  const omniChain = OMNI_UTXO_CHAINS[chain.key];
  if (omniChain) {
    return omniChain;
  }
  throw new Error('Omni takes no deposits from ' + chain.key);
}

/**
 * Deposit into a NEAR ntt manager through Omni.
 *
 * - Pays the Omni address ordered for the manager, the msg and the sender
 * - Omni mints into the manager, which locks and publishes
 * - No `refund_to`: a failed publish refunds Omni's account
 *
 * @param hub - NEAR chain the manager is deployed on
 */
const transfer = (hub: NearChain): PaymentConfigBuilder => ({
  build: async (params) => {
    const { address, amount, asset, sender, source, destination } = params;

    const chain = omniChainOf(source.chain);
    const client = getOmniClient(source.chain);

    if (!source.chain.isValidAddress(sender)) {
      throw new Error(
        'Omni refunds to a ' + source.chain.name + ' address only: ' + sender
      );
    }

    const ntt = NttRegistry.fromChain(hub, asset);
    const connector = client.getConnector(chain);
    if (ntt.token !== connector.token) {
      throw new Error(
        `Omni mints ${chain} as ${connector.token}, not the ${ntt.token} ` +
          `${ntt.manager} locks`
      );
    }

    const msg = await getNearTransferMsg(destination.chain, address);
    const to = await client.getDepositAddress({
      chain,
      recipient: ntt.manager,
      msg,
      refundAddress: sender,
    });

    return [
      new PaymentConfig({
        to,
        amount,
        min: connector.minDeposit,
        func: 'safeDeposit',
        module: 'Omni',
        type: callTypeOf(source.chain),
      }),
    ];
  },
});

export const Ntt = () => {
  return {
    transfer,
  };
};
