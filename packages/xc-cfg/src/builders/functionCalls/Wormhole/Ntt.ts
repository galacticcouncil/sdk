import {
  EvmParachain,
  FunctionCallConfig,
  FunctionCallConfigBuilder,
  NearBalanceType,
  NearChain,
  NearDeposit,
  NearGas,
  Ntt as NttRegistry,
  Wormhole as Wh,
} from '@galacticcouncil/xc-core';

import { NTT_TRIMMED_DECIMALS } from '../../../bridges/wormhole';
import { floorToPrecision } from '../../utils';

/**
 * Transfer out of a NEAR locking manager.
 *
 * - `ft_transfer_call` hands the token to the manager, which locks it and
 *   publishes the message
 * - A refused transfer (rate limit, pause) is refunded whole by the token
 * - The manager takes the recipient as 32 bytes, an h160 left-padded
 */
const transfer = (): FunctionCallConfigBuilder => ({
  build: async (params) => {
    const { address, amount, asset, source, destination } = params;
    const ctx = source.chain as NearChain;
    const rcv = destination.chain;

    const ntt = NttRegistry.fromChain(ctx, asset);
    const rcvWh = Wh.fromChain(rcv);

    let rcvAddress = address;
    if (rcv instanceof EvmParachain) {
      rcvAddress = await rcv.getDerivatedAddress(address);
    }

    // The manager trims to 8 decimals and hands the dust back - floored
    // upfront, so the amount sent is the amount that lands.
    const transferAmount = floorToPrecision(
      amount,
      ctx.getAssetDecimals(asset) ?? 0,
      NTT_TRIMMED_DECIMALS
    );

    const msg = {
      recipient_chain: rcvWh.getWormholeId(),
      recipient: rcvWh.normalizeAddress(rcvAddress),
    };

    return [
      new FunctionCallConfig({
        receiverId: ntt.token,
        args: {
          receiver_id: ntt.manager,
          amount: transferAmount.toString(),
          msg: JSON.stringify(msg),
        },
        gas: NearGas.transfer,
        deposit: NearDeposit.oneYocto,
        wrapNative: ctx.getBalanceType(asset) === NearBalanceType.Native,
        func: 'ft_transfer_call',
        module: 'NttManager',
      }),
    ];
  },
});

export const Ntt = () => {
  return {
    transfer,
  };
};
