import { Codec, getTypedCodecs } from 'polkadot-api';
import {
  hub,
  XcmVersionedXcm,
  XcmVersionedLocation,
} from '@galacticcouncil/descriptors';

/**
 * SCALE codecs for encoding XCM V5 types to raw bytes,
 *
 * Uses PAPI's canonical codecs derived from chain metadata
 */

interface XcmCodecs {
  message: Codec<XcmVersionedXcm>;
  location: Codec<XcmVersionedLocation>;
}

let cached: XcmCodecs | null = null;

export async function getXcmCodecs(): Promise<XcmCodecs> {
  if (cached) return cached;
  const codecs = await getTypedCodecs(hub);
  cached = {
    message: codecs.tx.PolkadotXcm.send.inner.message,
    location: codecs.tx.PolkadotXcm.send.inner.dest,
  };
  return cached;
}
