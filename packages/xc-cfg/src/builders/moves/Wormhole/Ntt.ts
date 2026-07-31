import {
  EvmParachain,
  MoveConfig,
  MoveConfigBuilder,
  Ntt as NttRegistry,
  suiPkg,
  SuiChain,
  Wormhole as Wh,
} from '@galacticcouncil/xc-core';

import { Transaction } from '@mysten/sui/transactions';
import { SUI_CLOCK_OBJECT_ID } from '@mysten/sui/utils';

import { encoding } from '@wormhole-foundation/sdk-base';

const transfer = (): MoveConfigBuilder => ({
  build: async (params) => {
    const { address, amount, asset, source, destination } = params;
    const ctx = source.chain as SuiChain;
    const rcv = destination.chain;

    const ntt = NttRegistry.fromChain(ctx, asset);
    const ctxWh = Wh.fromChain(ctx);
    const rcvWh = Wh.fromChain(rcv);
    const client = ctx.client;

    let rcvAddress = address;
    if (rcv instanceof EvmParachain) {
      rcvAddress = await rcv.getDerivatedAddress(address);
    }
    const recipient = encoding.hex.decode(rcvWh.normalizeAddress(rcvAddress));

    const coreStateId = ctxWh.getCoreBridge();
    const managerStateId = ntt.manager;
    const transceiverStateId = ntt.transceiver.wormhole;
    const coinType = ntt.token;

    const coinMetadataId = ntt.coinMetadata;
    if (!coinMetadataId) {
      throw new Error('Missing coin metadata object of ' + coinType);
    }

    const [coreBridgePackageId, nttPackageId, transceiverPackageId] =
      await Promise.all([
        suiPkg.getWormholePackageId(client, coreStateId),
        suiPkg.getCurrentPackageId(client, managerStateId),
        suiPkg.getCurrentPackageId(client, transceiverStateId),
      ]);

    const tx = new Transaction();

    // Only native sui is registered on the chain (SuiBalanceType.Native), so
    // the transferred coin is always split off gas. A coin-type source would
    // need the coin selection & merge of the reference sdk instead.
    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amount)]);

    const [versionGated] = tx.moveCall({
      target: `${nttPackageId}::upgrades::new_version_gated`,
      arguments: [],
    });

    // Trims the amount to the ntt wire precision (8 decimals), handing back
    // what didn't fit as `dust` - no revert on the sui side.
    const [transferTicket, dust] = tx.moveCall({
      target: `${nttPackageId}::ntt::prepare_transfer`,
      typeArguments: [coinType],
      arguments: [
        tx.object(managerStateId),
        coin!,
        tx.object(coinMetadataId),
        tx.pure.u16(rcvWh.getWormholeId()),
        tx.pure.vector('u8', Array.from(recipient)),
        tx.pure.option('vector<u8>', null),
        // Never queue - a rate limited transfer aborts instead of sitting
        // in the outbox with no way to release it from transfer history.
        tx.pure.bool(false),
      ],
    });

    // Read before the transfer consumes it - this is the sequence the
    // outbound message is emitted under.
    const [sequence] = tx.moveCall({
      target: `${nttPackageId}::state::get_next_sequence`,
      typeArguments: [coinType],
      arguments: [tx.object(managerStateId)],
    });

    tx.moveCall({
      target: `${nttPackageId}::ntt::transfer_tx_sender`,
      typeArguments: [coinType],
      arguments: [
        tx.object(managerStateId),
        versionGated!,
        tx.object(coinMetadataId),
        transferTicket!,
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });

    // Hand the outbox item to the transceiver & publish it as a vaa
    const [transceiverMessage] = tx.moveCall({
      target: `${nttPackageId}::state::create_transceiver_message`,
      typeArguments: [
        `${transceiverPackageId}::wormhole_transceiver::TransceiverAuth`,
        coinType,
      ],
      arguments: [
        tx.object(managerStateId),
        sequence!,
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });

    const [messageTicket] = tx.moveCall({
      target: `${transceiverPackageId}::wormhole_transceiver::release_outbound`,
      typeArguments: [`${nttPackageId}::auth::ManagerAuth`],
      arguments: [tx.object(transceiverStateId), transceiverMessage!],
    });

    const [feeCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(0n)]);

    tx.moveCall({
      target: `${coreBridgePackageId}::publish_message::publish_message`,
      arguments: [
        tx.object(coreStateId),
        feeCoin!,
        messageTicket!,
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });

    const [dustCoin] = tx.moveCall({
      target: '0x2::coin::from_balance',
      typeArguments: [coinType],
      arguments: [dust!],
    });
    tx.mergeCoins(tx.gas, [dustCoin!]);

    return new MoveConfig({
      transaction: tx,
      func: 'transfer',
      module: 'NttManager',
    });
  },
});

export const Ntt = () => {
  return {
    transfer,
  };
};
