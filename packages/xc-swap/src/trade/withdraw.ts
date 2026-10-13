import {
  NearDeposit,
  NearGas,
  type OneClickClient,
  type OneClickDeposit,
} from '@galacticcouncil/xc-core';
import { toNearCall, type NearCall } from '@galacticcouncil/xc-sdk';

import { mapQuoteError, quoteMinAmount } from './swap';
import { getOneClickQuote, type OneClickQuoteParams } from '../quote/oneClick';
import {
  DEFAULT_SLIPPAGE_PCT,
  NEAR_ZEC_ASSET,
  ZEC_ASSET,
  pctToBps,
} from '../registry/consts';
import { XcSwapError } from '../types';

const ZEC_TOKEN = 'zec.omft.near';
/** `zec.omft.near` storage registration, yocto. */
const ZEC_STORAGE_DEPOSIT = 1_250_000_000_000_000_000_000n;
const DEFAULT_DEADLINE_MS = 7 * 24 * 60 * 60 * 1000;
/** 1Click's refund account of an estimate, which never refunds. */
const ESTIMATE_REFUND_TO = 'hydration.sputnik-dao.near';

/** Inputs to `withdrawZec`. */
export interface XcZecWithdrawalParams {
  /**
   * NEAR account holding the ZEC; 1Click refunds it here.
   *
   * - Not needed for an estimate
   */
  from?: string;
  /** Zatoshi. */
  amount: bigint;
  /** Zcash transparent address. */
  recipient: string;
  /** Quote deadline as a Unix timestamp (ms). Default now + 7d. */
  deadline?: number;
}

/** Executable withdrawal, from a firm quote. */
export interface XcZecWithdrawalRequest {
  call: NearCall;
  depositAddress: string;
  correlationId: string;
  deadline: string;
}

/** Estimated withdrawal; viability is reported in `errors`, not thrown. */
export interface XcZecWithdrawal {
  /** Zatoshi delivered on Zcash. */
  amountOut: bigint;
  minAmountOut: bigint;
  /** Zatoshi kept by 1Click. */
  fee: bigint;
  /** Seconds. */
  timeEstimate: number;
  errors: XcSwapError[];
  /** Smallest amount 1Click takes, zatoshi; with `AmountTooLow`. */
  minAmount?: bigint;
  buildCall: () => Promise<XcZecWithdrawalRequest>;
}

function zecQuoteParams(
  amount: bigint,
  recipient: string,
  refundTo: string,
  deadline: number
): OneClickQuoteParams {
  return {
    amount,
    originAsset: NEAR_ZEC_ASSET,
    destinationAsset: ZEC_ASSET,
    recipient,
    refundTo,
    slippageBps: pctToBps(DEFAULT_SLIPPAGE_PCT),
    deadline,
  };
}

/** Firm 1Click quote: opens the NEAR deposit address. */
async function openZecDeposit(
  params: OneClickQuoteParams
): Promise<OneClickDeposit> {
  const { quote, correlationId } = await getOneClickQuote({
    ...params,
    dry: false,
  });
  if (!quote.depositAddress) {
    throw new Error('1Click did not return a deposit address');
  }
  return {
    depositAddress: quote.depositAddress,
    correlationId,
    deadline: quote.deadline ?? new Date(params.deadline).toISOString(),
  };
}

/**
 * Withdraw ZEC held on NEAR to Zcash, through 1Click.
 *
 * - Pays the firm quote's deposit address with a plain `ft_transfer`,
 *   registering it on the token first
 */
export async function withdrawZec(
  params: XcZecWithdrawalParams
): Promise<XcZecWithdrawal> {
  const { from, amount, recipient } = params;
  const quoteParams = zecQuoteParams(
    amount,
    recipient,
    from ?? ESTIMATE_REFUND_TO,
    params.deadline ?? Date.now() + DEFAULT_DEADLINE_MS
  );

  const errors: XcSwapError[] = [];
  let minAmount: bigint | undefined;
  const quote = await getOneClickQuote({ ...quoteParams, dry: true }).then(
    (res) => res.quote,
    (error) => {
      errors.push(mapQuoteError(error));
      minAmount = quoteMinAmount(error);
      return undefined;
    }
  );
  const amountOut = quote ? BigInt(quote.amountOut) : 0n;

  return {
    amountOut,
    minAmountOut: quote ? BigInt(quote.minAmountOut) : 0n,
    fee: quote ? amount - amountOut : 0n,
    timeEstimate: quote?.timeEstimate ?? 0,
    errors,
    minAmount,
    buildCall: async (): Promise<XcZecWithdrawalRequest> => {
      if (errors.length) {
        throw new Error(
          `Cannot build a non-viable withdrawal: ${errors.join(', ')}`
        );
      }
      if (!from) {
        throw new Error('A withdrawal needs the NEAR account holding the ZEC');
      }
      const { depositAddress, correlationId, deadline } =
        await openZecDeposit(quoteParams);

      const call = toNearCall(from, ZEC_TOKEN, [
        {
          methodName: 'storage_deposit',
          args: { account_id: depositAddress, registration_only: true },
          gas: NearGas.wrap,
          deposit: ZEC_STORAGE_DEPOSIT,
        },
        {
          methodName: 'ft_transfer',
          args: { receiver_id: depositAddress, amount: amount.toString() },
          gas: NearGas.payOut,
          deposit: NearDeposit.oneYocto,
        },
      ]);

      return { call, depositAddress, correlationId, deadline };
    },
  };
}

/**
 * 1Click client of ZEC withdrawals, for the zcash chain.
 *
 * - The integrator registers it: `zcash.registerOneClickClient(...)`
 */
export function createOneClickClient(): OneClickClient {
  return {
    async quote({ amount, recipient, refundTo }) {
      const { amountOut, fee, errors, minAmount } = await withdrawZec({
        from: refundTo,
        amount,
        recipient,
      });
      return { amountOut, fee, errors, minAmount };
    },
    openDeposit: ({ amount, recipient, refundTo }) =>
      openZecDeposit(
        zecQuoteParams(
          amount,
          recipient,
          refundTo,
          Date.now() + DEFAULT_DEADLINE_MS
        )
      ),
  };
}
