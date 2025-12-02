import { enums } from '@galacticcouncil/common';

export const getDeliveryFeeFromDryRun = (events: any[]): bigint => {
  const deliveryFees: bigint[] = [];

  for (const e of events) {
    const isXcmEvent =
      e.type === 'XcmPallet.FeesPaid' || e.type === 'PolkadotXcm.FeesPaid';

    if (isXcmEvent && e.value?.fees) {
      const fees = Array.isArray(e.value.fees) ? e.value.fees : [e.value.fees];
      for (const feeItem of fees) {
        if (feeItem.fun?.Fungible) {
          const plancks = BigInt(feeItem.fun.Fungible);
          deliveryFees.push(plancks);
        }
      }
    }
  }
  return deliveryFees.reduce((acc, df) => acc + df, 0n);
};

export const getErrorFromDryRun = (
  executionResult: any
): string | undefined => {
  const error = executionResult.value.error;

  if (error.type === 'Module') {
    return enums.enumPath(error.value);
  }
  return JSON.stringify(error.value);
};
