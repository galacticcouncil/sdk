import {
  EvmParachain,
  MoveConfig,
  MoveConfigBuilder,
  Parachain,
  Precompile,
  SuiChain,
  Wormhole as Wh,
} from '@galacticcouncil/xcm-core';

import { Transaction } from '@mysten/sui/transactions';
import { SUI_CLOCK_OBJECT_ID, SUI_TYPE_ARG } from '@mysten/sui/utils';

import { UniversalAddress } from '@wormhole-foundation/sdk-connect';
import {
  getOldestEmitterCapObjectId,
  getPackageId,
} from '@wormhole-foundation/sdk-sui';

import { mrl } from '../../utils';

type TransferMrlOpts = {
  moonchain: EvmParachain;
};

const transferNativeWithPayload = () => {
  return {
    viaMrl: (opts: TransferMrlOpts): MoveConfigBuilder => ({
      build: async (params) => {
        const { address, amount, source, sender, destination } = params;
        const ctx = source.chain;
        const ctxSui = ctx as SuiChain;

        const ctxWh = Wh.fromChain(ctx);
        const rcvWh = Wh.fromChain(opts.moonchain);

        const nonce = 0;
        const recipient = Precompile.Bridge;
        const payload = mrl.createPayload(
          destination.chain as Parachain,
          address
        );

        const recipientAddress = new UniversalAddress(recipient);
        const recipientChainId = rcvWh.getWormholeId();

        const coinType = SUI_TYPE_ARG;
        const [coreBridgePackageId, tokenBridgePackageId] = await Promise.all([
          getPackageId(ctxSui.client, ctxWh.coreBridge),
          getPackageId(ctxSui.client, ctxWh.tokenBridge),
        ]);

        const tx = new Transaction();
        const [transferCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(amount)]);
        const [feeCoin] = tx.splitCoins(tx.gas, [
          tx.pure.u64(destination.fee.amount),
        ]);
        const [assetInfo] = tx.moveCall({
          target: `${tokenBridgePackageId}::state::verified_asset`,
          arguments: [tx.object(ctxWh.tokenBridge)],
          typeArguments: [coinType],
        });

        let isNewEmitterCap = false;
        const emitterCap = await (async () => {
          const objectId = await getOldestEmitterCapObjectId(
            ctxSui.client,
            coreBridgePackageId,
            sender
          );
          if (objectId !== null) {
            return tx.object(objectId);
          } else {
            const [emitterCap] = tx.moveCall({
              target: `${coreBridgePackageId}::emitter::new`,
              arguments: [tx.object(ctxWh.coreBridge)],
            });
            isNewEmitterCap = true;
            return emitterCap;
          }
        })();

        const [transferTicket, dust] = tx.moveCall({
          target: `${tokenBridgePackageId}::transfer_tokens_with_payload::prepare_transfer`,
          arguments: [
            emitterCap,
            assetInfo,
            transferCoin,
            tx.pure.u16(recipientChainId),
            tx.pure.vector('u8', recipientAddress.toUint8Array()),
            tx.pure.vector('u8', payload.toU8a()),
            tx.pure.u32(nonce),
          ],
          typeArguments: [coinType],
        });

        tx.moveCall({
          target: `${tokenBridgePackageId}::coin_utils::return_nonzero`,
          arguments: [dust!],
          typeArguments: [coinType],
        });

        const [messageTicket] = tx.moveCall({
          target: `${tokenBridgePackageId}::transfer_tokens_with_payload::transfer_tokens_with_payload`,
          arguments: [tx.object(ctxWh.tokenBridge), transferTicket],
          typeArguments: [coinType],
        });

        tx.moveCall({
          target: `${coreBridgePackageId}::publish_message::publish_message`,
          arguments: [
            tx.object(ctxWh.coreBridge),
            feeCoin,
            messageTicket,
            tx.object(SUI_CLOCK_OBJECT_ID),
          ],
        });

        if (isNewEmitterCap) {
          tx.transferObjects([emitterCap!], tx.pure.address(sender));
        }

        return new MoveConfig({
          transaction: tx,
          func: 'TransferNativeWithPayload',
          module: 'TokenBridge',
        });
      },
    }),
  };
};

export const TokenBridge = () => {
  return {
    transferNativeWithPayload,
  };
};
