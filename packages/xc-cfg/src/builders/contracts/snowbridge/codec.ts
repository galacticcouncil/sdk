import { Codec } from 'polkadot-api';
import {
  XcmVersionedXcm,
  XcmVersionedLocation,
} from '@galacticcouncil/descriptors';
import { codec } from '@galacticcouncil/xc-core';

interface XcmCodecs {
  message: Codec<XcmVersionedXcm>;
  location: Codec<XcmVersionedLocation>;
}

let cached: XcmCodecs | null = null;

export async function getXcmCodecs(): Promise<XcmCodecs> {
  if (cached) return cached;
  const codecs = await codec.getHubCodecs();
  cached = {
    message: codecs.tx.PolkadotXcm.send.inner.message,
    location: codecs.tx.PolkadotXcm.send.inner.dest,
  };
  return cached;
}
