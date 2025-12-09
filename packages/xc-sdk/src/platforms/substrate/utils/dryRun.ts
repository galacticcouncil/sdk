import { enums } from '@galacticcouncil/common';

export const getDeliveryFeeFromDryRun = (events: any[]): bigint => {
  const deliveryFees: bigint[] = [];

  for (const e of events) {
    const isXcmEvent =
      ['PolkadotXcm'].includes(e.type) && e.value.type === 'FeesPaid';

    if (isXcmEvent) {
      const fees = e.value.value.fees;
      for (const fee of fees) {
        if (fee.fun.type === 'Fungible') {
          const plancks = BigInt(fee.fun.value);
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
