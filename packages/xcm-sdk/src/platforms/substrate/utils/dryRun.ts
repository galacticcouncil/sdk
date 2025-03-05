import { ApiPromise } from '@polkadot/api';

import { BN } from '@polkadot/util';

export const getDeliveryFeeFromDryRun = (ok: any): bigint => {
  const deliveryFees: bigint[] = [];

  for (const e of ok.emittedEvents) {
    const isXcmEvent = e.section === 'xcmPallet' || e.section === 'polkadotXcm';
    const isFeesPaid = e.method === 'FeesPaid';
    if (isXcmEvent && isFeesPaid && e.data.fees) {
      for (const feeItem of e.data.fees) {
        if (feeItem.fun.NonFungible) continue;
        const amount = feeItem.fun.Fungible;
        const plancks = BigInt(amount.replace(/,/g, ''));
        deliveryFees.push(plancks);
      }
    }
  }
  return deliveryFees.reduce((acc, df) => acc + df, 0n);
};

export const getErrorFromDryRun = (api: ApiPromise, ok: any): string => {
  const err = ok.executionResult.Err.error;
  if (err.Module) {
    const { error, index } = err.Module;

    const errorIndex = Number(error.slice(0, 4));
    const decoded = api.registry.findMetaError({
      error: new BN(errorIndex),
      index: new BN(index),
    });
    return `${decoded.section}.${decoded.method}: ${decoded.docs.join(' ')}`;
  } else {
    return JSON.stringify(err);
  }
};
