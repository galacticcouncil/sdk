import { SuiClient, SuiMoveNormalizedType } from '@mysten/sui/client';
import { normalizeStructTag, SUI_TYPE_ARG } from '@mysten/sui/utils';

/**
 * Sui move package resolution.
 *
 * Move calls target the *current* package id of an upgradeable package,
 * which is not the id its state object was created under. Every ntt call
 * (transfer & redeem alike) has to resolve it from chain first.
 */

export type SuiObject = {
  type: string;
  fields: Record<string, any>;
};

export async function getObject(
  client: SuiClient,
  objectId: string
): Promise<SuiObject> {
  const { data } = await client.getObject({
    id: objectId,
    options: { showContent: true, showType: true },
  });
  const content = data?.content as { fields?: Record<string, any> };
  if (!data?.type || !content?.fields) {
    throw new Error('Failed to fetch object ' + objectId);
  }
  return { type: data.type, fields: content.fields };
}

/** CoinMetadata<0x2::sui::SUI> - fixed framework object on mainnet. */
const SUI_COIN_METADATA_ID =
  '0x9258181f5ceac8dbffb7030890243caed69a9599d2886d957a9cb7656af3bdb3';

/**
 * Legacy CoinMetadata object id of a coin type.
 *
 * Registry-migrated rpc nodes resolve `getCoinMetadata` to the new
 * coin_registry Currency object, which the ntt calls (declared against
 * &CoinMetadata) can't take - the id is only used when it verifies as
 * the legacy type. Native sui always resolves the new way; its legacy
 * metadata object is well known.
 */
export async function getCoinMetadataId(
  client: SuiClient,
  coinType: string
): Promise<string> {
  const metadata = await client.getCoinMetadata({ coinType });
  if (metadata?.id) {
    const { type } = await getObject(client, metadata.id);
    if (type.includes('::coin::CoinMetadata<')) {
      return metadata.id;
    }
  }
  if (normalizeStructTag(coinType) === normalizeStructTag(SUI_TYPE_ARG)) {
    return SUI_COIN_METADATA_ID;
  }
  throw new Error('Unable to resolve coin metadata of ' + coinType);
}

/** Wormhole core package id (CurrentPackage dynamic field). */
export async function getWormholePackageId(
  client: SuiClient,
  coreStateId: string
): Promise<string> {
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
      const obj = await getObject(client, current.objectId);
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
export async function getCurrentPackageId(
  client: SuiClient,
  stateId: string
): Promise<string> {
  const state = await getObject(client, stateId);
  const original = state.type.split('::')[0];
  const upgradeCapId = state.fields['upgrade_cap_id'];
  if (!upgradeCapId) {
    return original;
  }
  const upgradeCap = await getObject(client, upgradeCapId);
  const cap = upgradeCap.fields['cap'];
  return cap?.fields?.package ?? cap?.package ?? original;
}

/** ntt-common package id, from the manager State inbox declared type. */
export async function getNttCommonPackageId(
  client: SuiClient,
  managerStateId: string
): Promise<string> {
  const state = await getObject(client, managerStateId);
  const [pkg, module, struct] = state.type.split('<')[0].split('::');
  const { fields } = await client.getNormalizedMoveStruct({
    package: pkg,
    module: module,
    struct: struct,
  });
  // State.inbox is declared Inbox<native_token_transfer::NativeTokenTransfer>;
  // its type argument address is the ntt-common package.
  const inbox = fields.find((f) => f.name === 'inbox')?.type;
  const item = asStruct(inbox)?.typeArguments[0];
  const address = asStruct(item)?.address;
  if (!address) {
    throw new Error('Unable to resolve ntt common package');
  }
  return address;
}

function asStruct(type?: SuiMoveNormalizedType) {
  if (type && typeof type === 'object' && 'Struct' in type) {
    return type.Struct;
  }
  return undefined;
}
