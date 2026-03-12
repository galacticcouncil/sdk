import { PolkadotClient } from 'polkadot-api';

import {
  metadata as metadataCodec,
  V15,
} from '@polkadot-api/substrate-bindings';

import { hydration } from '@galacticcouncil/descriptors';

import { PapiExecutor } from '../PapiExecutor';
import { ApiUrl } from '../types';

const EVM_PALLET_INDEX = 90;
const EVM_CALLS_INDEX = 284;

class GetIndex extends PapiExecutor {
  async script(client: PolkadotClient) {
    const metadataBytes = await hydration.getMetadata();

    const { metadata } = metadataCodec.dec(metadataBytes);
    const { pallets, lookup } = metadata.value as V15;

    const palletByIndex = new Map(pallets.map((p) => [p.index, p] as const));
    const lookupById = new Map(lookup.map((t) => [t.id, t] as const));

    const pallet = palletByIndex.get(EVM_PALLET_INDEX);
    console.log(pallet);

    const calls = lookupById.get(EVM_CALLS_INDEX);
    console.log(calls);

    if (calls && calls.def.tag === 'variant') {
      console.log(calls.def.value);
    }

    return () => {
      client.destroy();
    };
  }
}

new GetIndex(ApiUrl.Hydration, 'Get pools').run();
