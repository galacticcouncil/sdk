import { CallType, SuiChain, Wormhole as Wh } from '@galacticcouncil/xc-core';

import { Transaction } from '@mysten/sui/transactions';
import { SUI_CLOCK_OBJECT_ID } from '@mysten/sui/utils';
import { toBase64 } from '@mysten/bcs';
import {
  encoding,
  serialize,
  toChainId,
} from '@wormhole-foundation/sdk-connect';
import { deserialize } from '@wormhole-foundation/sdk-definitions';
import { getPackageId } from '@wormhole-foundation/sdk-sui';
import { getTokenCoinType } from '@wormhole-foundation/sdk-sui-tokenbridge';

import { SuiCall } from './types';
import { resolveCommandsTyped } from './utils';

export class SuiClaim {
  readonly #chain: SuiChain;

  constructor(chain: SuiChain) {
    this.#chain = chain;
  }

  async redeem(from: string, vaaRaw: string): Promise<SuiCall> {
    const ctxWh = Wh.fromChain(this.#chain);
    const client = this.#chain.client;

    const vaaBytes = encoding.b64.decode(vaaRaw);
    const vaa = deserialize('TokenBridge:Transfer', vaaBytes);

    const coreBridgeObjectId = ctxWh.getCoreBridge();
    const tokenBridgeObjectId = ctxWh.getTokenBridge();

    const coinType = await getTokenCoinType(
      client,
      tokenBridgeObjectId,
      vaa.payload.token.address.toUint8Array(),
      toChainId(vaa.payload.token.chain)
    );

    if (!coinType) {
      throw new Error('Unable to fetch token coinType');
    }

    const [coreBridgePackageId, tokenBridgePackageId] = await Promise.all([
      getPackageId(client, coreBridgeObjectId),
      getPackageId(client, tokenBridgeObjectId),
    ]);

    const tx = new Transaction();
    tx.setSender(from);

    const [verifiedVAA] = tx.moveCall({
      target: `${coreBridgePackageId}::vaa::parse_and_verify`,
      arguments: [
        tx.object(coreBridgeObjectId),
        tx.pure.vector('u8', serialize(vaa)),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });

    const [tokenBridgeMessage] = tx.moveCall({
      target: `${tokenBridgePackageId}::vaa::verify_only_once`,
      arguments: [tx.object(tokenBridgeObjectId), verifiedVAA!],
    });

    const [relayerReceipt] = tx.moveCall({
      target: `${tokenBridgePackageId}::complete_transfer::authorize_transfer`,
      arguments: [tx.object(tokenBridgeObjectId), tokenBridgeMessage!],
      typeArguments: [coinType],
    });

    const [coins] = tx.moveCall({
      target: `${tokenBridgePackageId}::complete_transfer::redeem_relayer_payout`,
      arguments: [relayerReceipt!],
      typeArguments: [coinType],
    });

    tx.moveCall({
      target: `${tokenBridgePackageId}::coin_utils::return_nonzero`,
      arguments: [coins!],
      typeArguments: [coinType],
    });

    const txBytes = await tx.build({ client });
    const txJson = await tx.toJSON();
    const commands = resolveCommandsTyped(JSON.parse(txJson));

    return {
      from: from,
      commands: commands,
      data: toBase64(txBytes),
      type: CallType.Sui,
    } as SuiCall;
  }
}
