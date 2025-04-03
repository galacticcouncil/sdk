import { ApiPromise } from '@polkadot/api';

import { Vec, Bytes } from '@polkadot/types';
import { PolkadotCorePrimitivesOutboundHrmpMessage } from '@polkadot/types/lookup';

export async function printUmp(api: ApiPromise) {
  const upward = await api.query.parachainSystem.upwardMessages();
  upward.forEach((value) => {
    console.log(value.toHuman());
    console.log(value.toHex());

    const val = api.createType('XcmVersionedXcm', value).toJSON();
    console.log(JSON.stringify(val, null, 2));
  });
}

export async function printHrmp(api: ApiPromise) {
  const hrmpOutbound = await api.query.parachainSystem.hrmpOutboundMessages();
  hrmpOutbound.forEach((value) => {
    const val = (value as unknown as any[]).map(({ recipient, data }) => ({
      data: api
        .createType('(XcmpMessageFormat, XcmVersionedXcm)', data)
        .toJSON(),
      recipient,
    }));
    console.log(JSON.stringify(val, null, 2));
  });
}
