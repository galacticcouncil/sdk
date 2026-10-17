import {
  AnyChain,
  CallType,
  DepositConfig,
  DepositConfigBuilder,
  NearChain,
  Ntt as NttRegistry,
  ZecChain,
} from '@galacticcouncil/xc-core';

import { getDepositMsg, OMNI_REFUND_TO } from '../../../bridges/omni';
import { omniClient } from '../../../clients';

/** Platform signing a deposit on the source chain. */
function callTypeOf(chain: AnyChain): CallType {
  if (chain instanceof ZecChain) {
    return CallType.Zec;
  }
  throw new Error('No deposit platform for ' + chain.name);
}

/**
 * Deposit into a NEAR ntt manager through Omni.
 *
 * - Pays the Omni address ordered for the manager, the msg and the sender
 * - Omni mints into the manager, which locks and publishes
 * - A refused mint refunds the sender on the source chain
 * - A failed publish refunds {@link OMNI_REFUND_TO}
 *
 * @param hub - NEAR chain the manager is deployed on
 */
const transfer = (hub: NearChain): DepositConfigBuilder => ({
  build: async (params) => {
    const { address, amount, asset, sender, source, destination } = params;

    if (!source.chain.isValidAddress(sender)) {
      throw new Error(
        'Omni refunds to a ' + source.chain.name + ' address only: ' + sender
      );
    }

    const omni = omniClient(source.chain, hub);
    const { connector } = omni;

    const ntt = NttRegistry.fromChain(hub, asset);
    if (ntt.token !== connector.token) {
      throw new Error(
        `Omni mints ${connector.chain} as ${connector.token}, not the ` +
          `${ntt.token} ${ntt.manager} locks`
      );
    }

    const msg = await getDepositMsg(destination.chain, address, OMNI_REFUND_TO);
    const to = await omni.getDepositAddress({
      recipient: ntt.manager,
      msg,
      refundAddress: sender,
    });

    return [
      new DepositConfig({
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
