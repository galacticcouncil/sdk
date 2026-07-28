import {
  NttTokenDef,
  SuiChain,
  Wormhole as Wh,
} from '@galacticcouncil/xc-core';

import { SuiClient, SuiMoveNormalizedType } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { SUI_CLOCK_OBJECT_ID } from '@mysten/sui/utils';

import {
  encoding,
  serializeLayout,
  toChainId,
} from '@wormhole-foundation/sdk-base';
import { deserialize } from '@wormhole-foundation/sdk-definitions';
import { nativeTokenTransferLayout } from '@wormhole-foundation/sdk-definitions-ntt';

import { SuiCall } from './types';
import { buildSuiCall } from './utils';

type SuiObject = {
  type: string;
  fields: Record<string, any>;
};

export class SuiClaim {
  readonly #chain: SuiChain;
  readonly #client: SuiClient;

  constructor(chain: SuiChain) {
    this.#chain = chain;
    this.#client = chain.client;
  }

  /**
   * Redeem NTT transfer on Sui.
   *
   * Single transaction, mirroring the reference sui NTT sdk redeem:
   * verify the VAA against the core bridge, validate it through the
   * wormhole transceiver, redeem to the manager inbox & release the
   * inbox item to the recipient.
   *
   * @param from - payer address
   * @param vaaRaw - base64 encoded signed VAA (wormholescan raw format)
   * @param ntt - NTT token deployment on Sui (state object ids)
   * @returns claim move call
   */
  async redeem(
    from: string,
    vaaRaw: string,
    ntt: NttTokenDef
  ): Promise<SuiCall> {
    const ctxWh = Wh.fromChain(this.#chain);
    const client = this.#client;

    const vaaBytes = encoding.b64.decode(vaaRaw);
    const vaa = deserialize('Ntt:WormholeTransfer', vaaBytes);
    const nttPayload = vaa.payload.nttManagerPayload;

    const coreStateId = ctxWh.getCoreBridge();
    const managerStateId = ntt.manager;
    const transceiverStateId = ntt.transceiver.wormhole;
    const coinType = ntt.token;

    const [
      coreBridgePackageId,
      nttPackageId,
      transceiverPackageId,
      nttCommonPackageId,
      coinMetadata,
    ] = await Promise.all([
      this.getWormholePackageId(coreStateId),
      this.getCurrentPackageId(managerStateId),
      this.getCurrentPackageId(transceiverStateId),
      this.getNttCommonPackageId(managerStateId),
      client.getCoinMetadata({ coinType }),
    ]);

    if (!coinMetadata?.id) {
      throw new Error('Unable to fetch coin metadata of ' + coinType);
    }

    const tx = new Transaction();

    // Verify VAA, validate through transceiver & redeem to manager inbox
    const [verifiedVaa] = tx.moveCall({
      target: `${coreBridgePackageId}::vaa::parse_and_verify`,
      arguments: [
        tx.object(coreStateId),
        tx.pure.vector('u8', Array.from(vaaBytes)),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });

    const [validatedMessage] = tx.moveCall({
      target: `${transceiverPackageId}::wormhole_transceiver::validate_message`,
      typeArguments: [`${nttPackageId}::auth::ManagerAuth`],
      arguments: [tx.object(transceiverStateId), verifiedVaa!],
    });

    const [versionGated] = tx.moveCall({
      target: `${nttPackageId}::upgrades::new_version_gated`,
      arguments: [],
    });

    tx.moveCall({
      target: `${nttPackageId}::ntt::redeem`,
      typeArguments: [
        coinType,
        `${transceiverPackageId}::wormhole_transceiver::TransceiverAuth`,
      ],
      arguments: [
        tx.object(managerStateId),
        versionGated!,
        tx.object(coinMetadata.id),
        validatedMessage!,
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });

    // Reconstruct the manager message & release the inbox item
    const payloadBytes = serializeLayout(
      nativeTokenTransferLayout,
      nttPayload.payload
    );

    const [nativeTokenTransfer] = tx.moveCall({
      target: `${nttCommonPackageId}::native_token_transfer::parse`,
      arguments: [tx.pure.vector('u8', Array.from(payloadBytes))],
    });

    const [messageId] = tx.moveCall({
      target: `${coreBridgePackageId}::bytes32::from_bytes`,
      arguments: [tx.pure.vector('u8', Array.from(nttPayload.id))],
    });

    const [sender] = tx.moveCall({
      target: `${coreBridgePackageId}::external_address::from_address`,
      arguments: [tx.pure.address(nttPayload.sender.toString())],
    });

    const [managerMessage] = tx.moveCall({
      target: `${nttCommonPackageId}::ntt_manager_message::new`,
      typeArguments: [
        `${nttCommonPackageId}::native_token_transfer::NativeTokenTransfer`,
      ],
      arguments: [messageId!, sender!, nativeTokenTransfer!],
    });

    const [releaseVersionGated] = tx.moveCall({
      target: `${nttPackageId}::upgrades::new_version_gated`,
      arguments: [],
    });

    tx.moveCall({
      target: `${nttPackageId}::ntt::release`,
      typeArguments: [coinType],
      arguments: [
        tx.object(managerStateId),
        releaseVersionGated!,
        tx.pure.u16(toChainId(vaa.emitterChain)),
        managerMessage!,
        tx.object(coinMetadata.id),
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    });

    return buildSuiCall(from, tx, this.#client);
  }

  /** Wormhole core package id (CurrentPackage dynamic field). */
  private async getWormholePackageId(coreStateId: string): Promise<string> {
    const client = this.#client;
    let cursor: string | null | undefined;
    do {
      const page = await client.getDynamicFields({
        parentId: coreStateId,
        cursor: cursor,
      });
      const current = page.data.find((f) =>
        f.name.type.endsWith('CurrentPackage')
      );
      if (current) {
        const obj = await this.getObject(current.objectId);
        const value = obj.fields['value'];
        const pkg = value?.fields?.package ?? value?.package;
        if (pkg) {
          return pkg;
        }
        break;
      }
      cursor = page.hasNextPage ? page.nextCursor : null;
    } while (cursor);
    throw new Error('Unable to resolve wormhole core package');
  }

  /** Latest package id of a state object (via its upgrade cap, if any). */
  private async getCurrentPackageId(stateId: string): Promise<string> {
    const state = await this.getObject(stateId);
    const original = state.type.split('::')[0];
    const upgradeCapId = state.fields['upgrade_cap_id'];
    if (!upgradeCapId) {
      return original;
    }
    const upgradeCap = await this.getObject(upgradeCapId);
    const cap = upgradeCap.fields['cap'];
    return cap?.fields?.package ?? cap?.package ?? original;
  }

  /** ntt-common package id, from the manager State inbox declared type. */
  private async getNttCommonPackageId(managerStateId: string): Promise<string> {
    const state = await this.getObject(managerStateId);
    const [pkg, module, struct] = state.type.split('<')[0].split('::');
    const { fields } = await this.#client.getNormalizedMoveStruct({
      package: pkg,
      module: module,
      struct: struct,
    });
    // State.inbox is declared Inbox<native_token_transfer::NativeTokenTransfer>;
    // its type argument address is the ntt-common package.
    const inbox = fields.find((f) => f.name === 'inbox')?.type;
    const item = this.asStruct(inbox)?.typeArguments[0];
    const address = this.asStruct(item)?.address;
    if (!address) {
      throw new Error('Unable to resolve ntt common package');
    }
    return address;
  }

  private asStruct(type?: SuiMoveNormalizedType) {
    if (type && typeof type === 'object' && 'Struct' in type) {
      return type.Struct;
    }
    return undefined;
  }

  private async getObject(objectId: string): Promise<SuiObject> {
    const { data } = await this.#client.getObject({
      id: objectId,
      options: { showContent: true, showType: true },
    });
    const content = data?.content as { fields?: Record<string, any> };
    if (!data?.type || !content?.fields) {
      throw new Error('Failed to fetch object ' + objectId);
    }
    return { type: data.type, fields: content.fields };
  }
}
