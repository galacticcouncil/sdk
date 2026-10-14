import { CallType } from '@galacticcouncil/xc-core';

import { ZecCall } from './types';

export const ZEC_DECIMALS = 8;

/** ZIP-317 marginal fee, zatoshi per logical action. */
export const ZEC_MARGINAL_FEE = 5_000n;

/** Actions of a shielded-to-transparent payment, change included. */
export const ZEC_LOGICAL_ACTIONS = 4n;

export function toZecCall(from: string, to: string, amount: bigint): ZecCall {
  return {
    from,
    to,
    amount,
    type: CallType.Zec,
    data: JSON.stringify({ to, amount: amount.toString() }),
    dryRun: async () => undefined,
  };
}

/** Zatoshi as the decimal ZEC string wallets take. */
export function formatZec(amount: bigint): string {
  const unit = 10n ** BigInt(ZEC_DECIMALS);
  const whole = amount / unit;
  const fraction = (amount % unit)
    .toString()
    .padStart(ZEC_DECIMALS, '0')
    .replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

/** ZIP-321 payment request of a call, for a QR code or a `zcash:` link. */
export function toZecPaymentUri(call: ZecCall): string {
  return `zcash:${call.to}?amount=${formatZec(call.amount)}`;
}
