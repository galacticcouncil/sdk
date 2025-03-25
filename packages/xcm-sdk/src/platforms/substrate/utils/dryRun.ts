import { ApiPromise } from '@polkadot/api';

import { Result, Vec } from '@polkadot/types';
import {
  Event,
  DispatchError,
  PostDispatchInfo,
} from '@polkadot/types/interfaces';

export const getDeliveryFeeFromDryRun = (events: Vec<Event>): bigint => {
  const deliveryFees: bigint[] = [];

  for (const e of events.values()) {
    const isXcmEvent = e.section === 'xcmPallet' || e.section === 'polkadotXcm';
    const isFeesPaid = e.method === 'FeesPaid';
    const data = e.data.toHuman() as any;

    if (isXcmEvent && isFeesPaid && data.fees) {
      for (const feeItem of data.fees) {
        if (feeItem.fun.NonFungible) continue;
        const amount = feeItem.fun.Fungible;
        const plancks = BigInt(amount.replace(/,/g, ''));
        deliveryFees.push(plancks);
      }
    }
  }
  return deliveryFees.reduce((acc, df) => acc + df, 0n);
};

export const getErrorFromDryRun = (
  api: ApiPromise,
  dispatchError: DispatchError
): string | undefined => {
  const { error } = dispatchError as any;

  if (!error.isModule) {
    return JSON.stringify(error.toHuman());
  }
  const decoded = api.registry.findMetaError(error.asModule);
  return `${decoded.section}.${decoded.method}: ${decoded.docs.join(' ')}`;
};
