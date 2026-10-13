import {
  NearChain,
  TransferCtx,
  TransferValidation,
  TransferValidationConstraint,
  TransferValidationError,
} from '@galacticcouncil/xc-core';

import { getOneClickClient } from '../../bridges/oneclick';

import { NttCustodyValidation, NttRateLimitValidation } from './ntt';

/**
 * A withdrawal through 1Click, before anything is paid.
 *
 * - 1Click's own checks on the amount and recipient, from a dry quote
 * - The ntt limits of the leg into NEAR, where the transfer lands first
 * - An unreadable quote fails closed
 */
export class OneClickWithdrawalValidation extends TransferValidation {
  readonly #hub: NearChain;
  readonly #legChecks = [
    new NttRateLimitValidation(
      () => true,
      () => true
    ),
    new NttCustodyValidation(
      () => true,
      () => true
    ),
  ];

  constructor(
    hub: NearChain,
    sourceConstraint: TransferValidationConstraint,
    destinationConstraint: TransferValidationConstraint
  ) {
    super(sourceConstraint, destinationConstraint);
    this.#hub = hub;
  }

  protected skipFor(ctx: TransferCtx): boolean {
    return !ctx.destination.chain.isZec();
  }

  async validate(ctx: TransferCtx) {
    // Without an amount the amount-bound checks see zero and pass.
    if (this.skipFor(ctx) || ctx.amount === 0n) {
      return;
    }

    const { address, amount, asset, destination, refundAddress, source } = ctx;

    const quote = await getOneClickClient(destination.chain)
      .quote({ amount, recipient: address, refundTo: refundAddress })
      .catch(() => undefined);
    const [error] = quote ? quote.errors : ['QuoteFailed'];

    if (error === 'AmountTooLow') {
      const min = quote?.minAmount;
      throw new TransferValidationError('OneClick_Amount_Too_Low', {
        amount:
          min === undefined
            ? undefined
            : source.balance.copyWith({ amount: min }).toDecimal(),
        asset: asset.originSymbol,
        chain: destination.chain.name,
        decimals: source.balance.decimals,
        min: min,
        error: 'oneClick.amountTooLow',
      });
    }

    if (error === 'RecipientInvalid') {
      throw new TransferValidationError('OneClick_Recipient_Invalid', {
        chain: destination.chain.name,
        error: 'oneClick.recipientInvalid',
      });
    }

    if (error) {
      throw new TransferValidationError('OneClick_Quote_Failed', {
        chain: destination.chain.name,
        error: 'oneClick.quoteFailed',
      });
    }

    // The ntt checks, as the leg into NEAR sees the transfer
    const legCtx = {
      ...ctx,
      destination: { ...destination, chain: this.#hub },
    };
    for (const check of this.#legChecks) {
      await check.validate(legCtx);
    }
  }
}
