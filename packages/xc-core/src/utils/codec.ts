import { getTypedCodecs } from 'polkadot-api';
import { hub } from '@galacticcouncil/descriptors';

type HubCodecs = Awaited<ReturnType<typeof getTypedCodecs<typeof hub>>>;

let cached: HubCodecs | null = null;

export async function getHubCodecs(): Promise<HubCodecs> {
  if (cached) return cached;
  cached = await getTypedCodecs(hub);
  return cached;
}
