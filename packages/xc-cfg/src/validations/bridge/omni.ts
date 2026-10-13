import {
  AnyChain,
  AssetAmount,
  NearChain,
  TransferCtx,
  TransferValidation,
  TransferValidationConstraint,
  TransferValidationError,
} from '@galacticcouncil/xc-core';
import { big } from '@galacticcouncil/common';

import { getOmniClient, OMNI_UTXO_CHAINS } from '../../bridges/omni';

import { NttRateLimitValidation } from './ntt';

const RE_AMOUNT = /^\d+$/;

function unreachable(chain: AnyChain): never {
  throw new TransferValidationError('Omni_Connector_Unreachable', {
    chain: chain.name,
    error: 'omni.connectorUnreachable',
  });
}

function parseMinDeposit(min: unknown): bigint {
  if (typeof min === 'string' && RE_AMOUNT.test(min)) {
    return BigInt(min);
  }
  throw new Error('Omni min_deposit_amount is malformed: ' + String(min));
}

/**
 * Omni deposit checks, before anything is paid.
 *
 * - The connector's live minimum: a smaller deposit is lost
 * - The NEAR manager's rate limits: a refused mint is refunded by hand only
 * - Fails closed when the connector can't be read
 */
export class OmniDepositValidation extends TransferValidation {
  readonly #hub: NearChain;
  readonly #limits = new NttRateLimitValidation(
    () => true,
    () => true
  );

  constructor(
    hub: NearChain,
    sourceConstraint: TransferValidationConstraint,
    destinationConstraint: TransferValidationConstraint
  ) {
    super(sourceConstraint, destinationConstraint);
    this.#hub = hub;
  }

  protected skipFor(ctx: TransferCtx): boolean {
    return !OMNI_UTXO_CHAINS[ctx.source.chain.key];
  }

  async validate(ctx: TransferCtx) {
    if (this.skipFor(ctx)) {
      return;
    }

    const { amount, asset, source } = ctx;
    const chain = OMNI_UTXO_CHAINS[source.chain.key];

    const min = await Promise.resolve()
      .then(() => getOmniClient(source.chain).getConnectorConfig(chain))
      .then((config) => parseMinDeposit(config.min_deposit_amount))
      .catch(() => unreachable(source.chain));

    // Without an amount the amount-bound checks see zero and pass.
    if (amount > 0n && amount < min) {
      throw new TransferValidationError('Omni_Below_Min_Deposit', {
        amount: source.balance.copyWith({ amount: min }).toDecimal(),
        asset: asset.originSymbol,
        chain: source.chain.name,
        decimals: source.balance.decimals,
        min: min,
        error: 'omni.belowMinDeposit',
      });
    }

    await this.#limits.validate(this.hubCtx(ctx));
  }

  /** The transfer as the hub sees it: the manager locks what Omni minted. */
  private hubCtx(ctx: TransferCtx): TransferCtx {
    const { amount, asset, source } = ctx;
    const decimals =
      this.#hub.getAssetDecimals(asset) ?? source.balance.decimals;
    const minted = AssetAmount.fromAsset(asset, {
      amount: big.convertDecimals(amount, source.balance.decimals, decimals),
      decimals: decimals,
    });
    return {
      ...ctx,
      amount: minted.amount,
      source: { ...source, chain: this.#hub, balance: minted },
    };
  }
}
