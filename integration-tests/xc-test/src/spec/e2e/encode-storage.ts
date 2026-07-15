import {
  getDynamicBuilder,
  getLookupFn,
} from '@polkadot-api/metadata-builders';
import {
  decAnyMetadata,
  unifyMetadata,
} from '@polkadot-api/substrate-bindings';
import { Binary, type HexString, type PolkadotClient } from 'polkadot-api';

/**
 * Storage in the shape chopsticks accepted:
 *
 *   { System: { Account: [ [[address], { providers: 1, data: { free } }] ] } }
 *
 * Keys and values are polkadot-api shaped — locations and asset ids go through
 * `encodeLocation` / `encodeAssetId` in storage.ts. Values may be partial:
 * missing fields are filled from the storage entry's metadata fallback (its
 * runtime default), which is what chopsticks did implicitly.
 */
export type DecodedStorage = Record<
  string,
  Record<string, Array<[unknown[], unknown]>>
>;

export type RawStorage = Array<[HexString, HexString | null]>;

/**
 * Encode decoded storage into the raw [key, value] hex pairs that forklift's
 * `dev_setStorage` takes.
 */
export const encodeStorage = async (
  client: PolkadotClient,
  storage: DecodedStorage
): Promise<RawStorage> => {
  const { hash } = await client.getFinalizedBlock();
  const builder = getDynamicBuilder(
    getLookupFn(unifyMetadata(decAnyMetadata(await client.getMetadata(hash))))
  );

  const raw: RawStorage = [];

  for (const [pallet, entries] of Object.entries(storage)) {
    for (const [entry, items] of Object.entries(entries)) {
      const codecs = builder.buildStorage(pallet, entry);

      for (const [keys, value] of items) {
        raw.push([
          codecs.keys.enc(...keys) as HexString,
          value === null
            ? null
            : Binary.toHex(
                codecs.value.enc(withDefaults(codecs.fallback, value))
              ),
        ]);
      }
    }
  }

  return raw;
};

/**
 * Overlay a partial value on top of the entry's metadata fallback.
 *
 * Entries declared `OptionQuery` have no fallback, so any field the caller
 * omits stays missing and encoding fails — those callers must pass a complete
 * value (see `assetAccount` in storage.ts).
 */
const withDefaults = (fallback: unknown, value: unknown): unknown => {
  if (value === undefined) return fallback;
  if (!isStruct(value)) return value;

  const base = isStruct(fallback) ? fallback : {};
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(value)) {
    out[k] = withDefaults(base[k], v);
  }
  return out;
};

/**
 * Only plain `{...}` literals are merged field-by-field. Anything else — a
 * Binary, a byte array, any class instance — is a leaf and replaces the default
 * outright.
 */
const isStruct = (v: unknown): v is Record<string, unknown> => {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return false;
  const proto = Object.getPrototypeOf(v);
  if (proto !== Object.prototype && proto !== null) return false;
  // papi models enums as `{ type, value }`, where `value` belongs to the variant
  // named by `type`. Merging one enum into another would graft the old variant's
  // payload onto the new variant, so treat enums as leaves.
  return !('type' in v);
};
