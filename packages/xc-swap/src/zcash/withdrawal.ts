import {
  AssetAmount,
  type TransferValidationReport,
} from '@galacticcouncil/xc-core';
import { TransferBuilder, type Transfer } from '@galacticcouncil/xc-sdk';
import { big } from '@galacticcouncil/common';

import { XcSwapError } from '../types';

import { openDeposit, quoteWithdrawal } from './oneClick';
import { memoize } from './utils';
import type {
  OneClickDeposit,
  ZcashCtx,
  ZcashTransfer,
  ZcashTransferArgs,
} from './types';

/** 1 ZEC: the flat fee is quoted on at least this, which no minimum refuses. */
const FEE_QUOTE_AMOUNT = 100_000_000n;

/**
 * NEAR account the estimates are built for.
 *
 * - Sizes the fee and runs the checks; nothing payable is built from it
 */
const STAND_IN = '0'.repeat(64);

/**
 * Hydration ZEC to Zcash: an ntt transfer to a 1Click deposit address on NEAR.
 *
 * - Fee, max and the ntt checks are the Hydration → NEAR transfer's own
 * - 1Click's fee and checks come from a dry quote
 * - Building the calls opens the deposit address, once per amount, and pays it
 *
 * @param ctx - wallet, refund account and Omni client
 * @param args - Hydration sender and Zcash recipient
 */
export async function buildWithdrawal(
  ctx: ZcashCtx,
  { srcAddress, dstAddress }: ZcashTransferArgs
): Promise<ZcashTransfer> {
  const { wallet, refundTo } = ctx;
  const zcash = wallet.config.getChain('zec');
  const zec = wallet.config.getAsset('zec');

  const toNear = (recipient: string): Promise<Transfer> =>
    TransferBuilder(wallet)
      .withAsset('zec')
      .withSource('hydration')
      .withDestination('near')
      .build({ srcAddress, dstAddress: recipient });

  const [estimate, dstBalance, feeQuote] = await Promise.all([
    toNear(STAND_IN),
    // Shown only; a Zcash balance needs the integrator's reader
    zcash.getBalance(zec, dstAddress).catch(() =>
      AssetAmount.fromAsset(zec, {
        amount: 0n,
        decimals: zcash.getAssetDecimals(zec) ?? 8,
      })
    ),
    quoteWithdrawal(FEE_QUOTE_AMOUNT, dstAddress, refundTo),
  ]);

  const { balance } = estimate.source;
  const oneClickFee = balance.copyWith({ amount: feeQuote.fee ?? 0n });

  const deposits = new Map<bigint, Promise<OneClickDeposit>>();
  const payers = new Map<string, Promise<Transfer>>();

  const oneClickReports = async (
    amount: bigint
  ): Promise<TransferValidationReport[]> => {
    // Without an amount the amount-bound checks see zero and pass.
    if (amount === 0n) {
      return [];
    }

    const { error, minAmount } = await quoteWithdrawal(
      amount,
      dstAddress,
      refundTo
    );
    switch (error) {
      case undefined:
        return [];
      case XcSwapError.AmountTooLow:
        return [
          {
            amount:
              minAmount === undefined
                ? undefined
                : balance.copyWith({ amount: minAmount }).toDecimal(),
            asset: zec.originSymbol,
            chain: zcash.name,
            decimals: balance.decimals,
            min: minAmount,
            error: 'oneClick.amountTooLow',
          },
        ];
      case XcSwapError.RecipientInvalid:
        return [{ chain: zcash.name, error: 'oneClick.recipientInvalid' }];
      default:
        return [{ chain: zcash.name, error: 'oneClick.quoteFailed' }];
    }
  };

  const transfer: ZcashTransfer = {
    source: { ...estimate.source, destinationFee: oneClickFee },
    destination: { balance: dstBalance, fee: oneClickFee },
    reversible: true,
    async buildCall(amount) {
      const [call] = await transfer.buildCalls(amount);
      return call;
    },
    async buildCalls(amount) {
      const target = big.toBigInt(amount, balance.decimals);
      const deposit = await memoize(deposits, target, () =>
        openDeposit(target, dstAddress, refundTo)
      );
      const payer = await memoize(payers, deposit.depositAddress, () =>
        toNear(deposit.depositAddress)
      );
      transfer.deposit = deposit;
      return payer.buildCalls(amount);
    },
    estimateFee(amount) {
      return estimate.estimateFee(amount);
    },
    async estimateDestinationFee(amount) {
      const target = big.toBigInt(amount, balance.decimals);
      const quoted = await quoteWithdrawal(
        target > FEE_QUOTE_AMOUNT ? target : FEE_QUOTE_AMOUNT,
        dstAddress,
        refundTo
      );
      const destinationFee = oneClickFee.copyWith({
        amount: quoted.fee ?? 0n,
      });
      transfer.source.destinationFee = destinationFee;
      transfer.destination.fee = destinationFee;
      return destinationFee;
    },
    async validate(fee, amount) {
      const target =
        amount === undefined ? 0n : big.toBigInt(amount, balance.decimals);
      const [reports, oneClick] = await Promise.all([
        estimate.validate(fee, amount),
        oneClickReports(target),
      ]);
      return [...reports, ...oneClick];
    },
  };

  return transfer;
}
