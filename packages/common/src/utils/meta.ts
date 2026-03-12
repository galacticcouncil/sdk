import {
  metadata as metadataCodec,
  u32,
  V15,
} from '@polkadot-api/substrate-bindings';

export type DecodedError = {
  pallet: string;
  error: string;
  desc: string;
};

export function ErrorDecoder(metadataBytes: Uint8Array) {
  const { metadata } = metadataCodec.dec(metadataBytes);
  const { pallets, lookup } = metadata.value as V15;

  const palletByIndex = new Map(pallets.map((p) => [p.index, p] as const));
  const lookupById = new Map(lookup.map((t) => [t.id, t] as const));

  return {
    decode(palletIndex: number, errorHex: string): DecodedError | undefined {
      const pallet = palletByIndex.get(palletIndex);
      if (!pallet?.errors) return;

      const errorType = lookupById.get(pallet.errors);
      if (!errorType || errorType.def.tag !== 'variant') return;

      const errorIndex = u32.dec(errorHex);
      const errorVariant = errorType.def.value.find(
        (v) => v.index === errorIndex
      );
      if (!errorVariant) return;

      return {
        pallet: pallet.name,
        error: errorVariant.name,
        desc: errorVariant.docs[0],
      } as DecodedError;
    },
  };
}
