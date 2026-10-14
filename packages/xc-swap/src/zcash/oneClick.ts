import { getOneClickQuote, type OneClickQuoteParams } from '../quote/oneClick';
import {
  DEFAULT_SLIPPAGE_PCT,
  NEAR_ZEC_ASSET,
  ZEC_ASSET,
  pctToBps,
} from '../registry/consts';
import { mapQuoteError, quoteMinAmount } from '../trade/swap';
import { XcSwapError } from '../types';

import type { OneClickDeposit } from './types';

const DEADLINE_MS = 7 * 24 * 60 * 60 * 1000;

/** NEAR implicit account: the hex of its key. */
const RE_IMPLICIT = /^[0-9a-f]{64}$/;

/** 1Click's verdict on a withdrawal. */
export interface OneClickWithdrawalQuote {
  /** Kept by 1Click, zatoshi; without it 1Click refused. */
  fee?: bigint;
  error?: XcSwapError;
  /** Smallest amount 1Click takes, zatoshi; with `AmountTooLow`. */
  minAmount?: bigint;
}

/** ZEC held on NEAR, withdrawn to a Zcash address. */
function withdrawal(
  amount: bigint,
  recipient: string,
  refundTo: string
): OneClickQuoteParams {
  return {
    amount,
    originAsset: NEAR_ZEC_ASSET,
    destinationAsset: ZEC_ASSET,
    recipient,
    refundTo,
    slippageBps: pctToBps(DEFAULT_SLIPPAGE_PCT),
    deadline: Date.now() + DEADLINE_MS,
  };
}

/**
 * Dry 1Click quote of a withdrawal.
 *
 * - A refusal is returned, not thrown
 *
 * @param amount - zatoshi landing at the deposit address
 * @param recipient - Zcash address
 * @param refundTo - NEAR account a refused deposit is refunded to
 */
export async function quoteWithdrawal(
  amount: bigint,
  recipient: string,
  refundTo: string
): Promise<OneClickWithdrawalQuote> {
  try {
    const { quote } = await getOneClickQuote({
      ...withdrawal(amount, recipient, refundTo),
      dry: true,
    });
    return { fee: amount - BigInt(quote.amountOut) };
  } catch (error) {
    return { error: mapQuoteError(error), minAmount: quoteMinAmount(error) };
  }
}

/**
 * Firm 1Click quote: opens the deposit address.
 *
 * - Refuses an address that isn't an implicit account: only those are
 *   published by the transfer paying them, the vaa alone can't name them
 *
 * @param amount - zatoshi landing at the deposit address
 * @param recipient - Zcash address
 * @param refundTo - NEAR account a refused deposit is refunded to
 */
export async function openDeposit(
  amount: bigint,
  recipient: string,
  refundTo: string
): Promise<OneClickDeposit> {
  const params = withdrawal(amount, recipient, refundTo);
  const { quote, correlationId } = await getOneClickQuote({
    ...params,
    dry: false,
  });

  const { depositAddress } = quote;
  if (!depositAddress || !RE_IMPLICIT.test(depositAddress)) {
    throw new Error(
      '1Click deposit address is not a NEAR implicit account: ' + depositAddress
    );
  }

  return {
    depositAddress,
    correlationId,
    deadline: quote.deadline ?? new Date(params.deadline).toISOString(),
  };
}
