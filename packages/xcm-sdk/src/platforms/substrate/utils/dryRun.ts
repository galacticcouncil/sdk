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
