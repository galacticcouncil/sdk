import { NearDeposit, NearGas } from '@galacticcouncil/xc-core';
import { toNearCall, type NearCall } from '@galacticcouncil/xc-sdk';

import { mapQuoteError } from './swap';
import { getOneClickQuote } from '../quote/oneClick';
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

/** Inputs to `withdrawZec`. */
export interface XcZecWithdrawalParams {
  /** NEAR account holding the ZEC; 1Click refunds it here. */
  from: string;
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
  buildCall: () => Promise<XcZecWithdrawalRequest>;
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
  const deadline = params.deadline ?? Date.now() + DEFAULT_DEADLINE_MS;
  const quoteParams = {
    amount,
    originAsset: NEAR_ZEC_ASSET,
    destinationAsset: ZEC_ASSET,
    recipient,
    refundTo: from,
    slippageBps: pctToBps(DEFAULT_SLIPPAGE_PCT),
    deadline,
  };

  const errors: XcSwapError[] = [];
  const quote = await getOneClickQuote({ ...quoteParams, dry: true }).then(
    (res) => res.quote,
    (error) => {
      errors.push(mapQuoteError(error));
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
    buildCall: async (): Promise<XcZecWithdrawalRequest> => {
      if (errors.length) {
        throw new Error(
          `Cannot build a non-viable withdrawal: ${errors.join(', ')}`
        );
      }
      const { quote: firm, correlationId } = await getOneClickQuote({
        ...quoteParams,
        dry: false,
      });
      const depositAddress = firm.depositAddress;
      if (!depositAddress) {
        throw new Error('1Click did not return a deposit address');
      }

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

      return {
        call,
        depositAddress,
        correlationId,
        deadline: new Date(deadline).toISOString(),
      };
    },
  };
}
