import {
  AnyChain,
  Asset,
  Ntt as NttRegistry,
  TransferCtx,
  TransferValidation,
  TransferValidationError,
} from '@galacticcouncil/xc-core';
import { big } from '@galacticcouncil/common';

import { nttClient } from '../../clients';

function unreachable(asset: Asset, chain: AnyChain): never {
  throw new TransferValidationError('Ntt_Limit_Unreachable', {
    asset: asset.originSymbol,
    chain: chain.name,
    error: 'ntt.limitUnreachable',
  });
}

export class NttRateLimitValidation extends TransferValidation {
  protected skipFor(ctx: TransferCtx): boolean {
    const { asset, destination, source } = ctx;
    return (
      !NttRegistry.isKnown(source.chain, asset) ||
      !NttRegistry.isKnown(destination.chain, destination.balance)
    );
  }

  async validate(ctx: TransferCtx) {
    if (this.skipFor(ctx)) {
      return;
    }

    const { amount, asset, destination, source } = ctx;

    const [outbound, inbound] = await Promise.all([
      nttClient(source.chain, asset)
        .getOutboundLimit()
        .catch(() => unreachable(asset, source.chain)),
      nttClient(destination.chain, destination.balance)
        .getInboundLimit(source.chain)
        .catch(() => unreachable(destination.balance, destination.chain)),
    ]);

    if (outbound.windowMs > 0 && amount > outbound.capacity) {
      throw new TransferValidationError('Ntt_Outbound_Limit_Exceeded', {
        asset: asset.originSymbol,
        chain: source.chain.name,
        decimals: source.balance.decimals,
        headroom: outbound.capacity,
        limit: outbound.limit,
        windowMs: outbound.windowMs,
        error: 'ntt.outboundLimitExceeded',
      });
    }

    const delivered = big.convertDecimals(
      amount,
      source.balance.decimals,
      destination.balance.decimals
    );

    if (inbound.windowMs > 0 && delivered > inbound.capacity) {
      throw new TransferValidationError('Ntt_Inbound_Limit_Exceeded', {
        asset: destination.balance.originSymbol,
        chain: destination.chain.name,
        decimals: destination.balance.decimals,
        headroom: inbound.capacity,
        limit: inbound.limit,
        windowMs: inbound.windowMs,
        error: 'ntt.inboundLimitExceeded',
      });
    }
  }
}
