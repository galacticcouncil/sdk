import {
  Abi,
  AnyChain,
  AnyEvmChain,
  AssetAmount,
  NearChain,
  TransferCtx,
  TransferValidation,
  TransferValidationConstraint,
  TransferValidationError,
} from '@galacticcouncil/xc-core';
import { big } from '@galacticcouncil/common';

import { OMNI_CONNECTORS } from '../../bridges/omni';
import { omniClient, OmniConnectorConfig } from '../../clients';

import { NttCustodyValidation, NttRateLimitValidation } from './ntt';

const RE_AMOUNT = /^\d+$/;

function unreachable(chain: AnyChain): never {
  throw new TransferValidationError('Omni_Connector_Unreachable', {
    chain: chain.name,
    error: 'omni.connectorUnreachable',
  });
}

function parseAmount(value: unknown): bigint {
  if (typeof value === 'string' && RE_AMOUNT.test(value)) {
    return BigInt(value);
  }
  throw new Error('Omni amount is malformed: ' + String(value));
}

/**
 * Omni transfers of a UTXO chain, before anything is signed.
 *
 * - Deposit: the connector's live minimum; a smaller one is neither minted
 *   nor refunded
 * - Withdrawal: the emitter fee plus the connector's live minimum; the
 *   emitter reverts below it
 * - The ntt leg through the NEAR hub: rate limits both ways, NEAR custody
 * - Fails closed when the connector or the emitter can't be read
 */
export class OmniValidation extends TransferValidation {
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

  /**
   * @param hub - NEAR chain the ntt leg settles on
   */
  constructor(
    hub: NearChain,
    sourceConstraint: TransferValidationConstraint,
    destinationConstraint: TransferValidationConstraint
  ) {
    super(sourceConstraint, destinationConstraint);
    this.#hub = hub;
  }

  private isDeposit(ctx: TransferCtx): boolean {
    return !!OMNI_CONNECTORS[ctx.source.chain.key];
  }

  private isWithdrawal(ctx: TransferCtx): boolean {
    return !!OMNI_CONNECTORS[ctx.destination.chain.key];
  }

  protected skipFor(ctx: TransferCtx): boolean {
    return !this.isDeposit(ctx) && !this.isWithdrawal(ctx);
  }

  async validate(ctx: TransferCtx) {
    if (this.skipFor(ctx)) {
      return;
    }

    if (this.isDeposit(ctx)) {
      await this.validateDeposit(ctx);
    } else {
      await this.validateWithdrawal(ctx);
    }
  }

  private async validateDeposit(ctx: TransferCtx) {
    const { amount, asset, source } = ctx;

    const config = await this.readConfig(source.chain);
    const min = parseAmount(config.min_deposit_amount);

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

    // Omni mints on NEAR, which publishes to the destination
    const balance = this.atHub(ctx, source.balance);
    await this.validateLeg({
      ...ctx,
      amount: big.convertDecimals(
        amount,
        source.balance.decimals,
        balance.decimals
      ),
      source: { ...source, chain: this.#hub, balance: balance },
    });
  }

  private async validateWithdrawal(ctx: TransferCtx) {
    const { amount, asset, source, destination } = ctx;
    const omni = omniClient(destination.chain, this.#hub);
    const evm = source.chain as AnyEvmChain;

    const [config, emitterFee] = await Promise.all([
      this.readConfig(destination.chain),
      evm.evmClient
        .getProvider()
        .readContract({
          abi: Abi.UtxoEmitter,
          address: omni.connector.withdrawal.emitter as `0x${string}`,
          functionName: 'fee',
        })
        .catch(() => unreachable(source.chain)) as Promise<bigint>,
    ]);
    const min = emitterFee + parseAmount(config.min_withdraw_amount);

    // Without an amount the amount-bound checks see zero and pass.
    if (amount > 0n && amount < min) {
      throw new TransferValidationError('Omni_Below_Min_Withdraw', {
        amount: source.balance.copyWith({ amount: min }).toDecimal(),
        asset: asset.originSymbol,
        chain: destination.chain.name,
        decimals: source.balance.decimals,
        min: min,
        error: 'omni.belowMinWithdraw',
      });
    }

    // The source settles on NEAR, where the bots withdraw from
    await this.validateLeg({
      ...ctx,
      destination: {
        ...destination,
        chain: this.#hub,
        balance: this.atHub(ctx, destination.balance),
      },
    });
  }

  private async readConfig(chain: AnyChain): Promise<OmniConnectorConfig> {
    return omniClient(chain, this.#hub)
      .getConfig()
      .catch(() => unreachable(chain));
  }

  /** The asset as the NEAR hub holds it. */
  private atHub(ctx: TransferCtx, balance: AssetAmount): AssetAmount {
    const decimals = this.#hub.getAssetDecimals(ctx.asset) ?? balance.decimals;
    return AssetAmount.fromAsset(ctx.asset, {
      amount: big.convertDecimals(balance.amount, balance.decimals, decimals),
      decimals: decimals,
    });
  }

  private async validateLeg(leg: TransferCtx) {
    for (const check of this.#legChecks) {
      await check.validate(leg);
    }
  }
}
