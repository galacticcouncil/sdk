import {
  ConfigService,
  TransferCtx,
  TransferValidation,
  TransferValidationConstraint,
  TransferValidationError,
  Wormhole,
} from '@galacticcouncil/xc-core';

import { WormholeGovernor, WormholeRateLimit } from '../clients';

export class WormholeRateLimitValidation extends TransferValidation {
  private governor: WormholeGovernor;
  private config: ConfigService;

  constructor(
    governor: WormholeGovernor,
    config: ConfigService,
    sourceConstraint: TransferValidationConstraint = () => true,
    destinationConstraint: TransferValidationConstraint = () => true
  ) {
    super(sourceConstraint, destinationConstraint);
    this.governor = governor;
    this.config = config;
  }

  private tokenOrigins(asset: TransferCtx['asset']) {
    const origins: { wormholeChainId: number; originAddress: string }[] = [];
    for (const chain of this.config.chains.values()) {
      if (!Wormhole.isKnown(chain) || !chain.getAsset(asset.key)) {
        continue;
      }
      const wormhole = Wormhole.fromChain(chain);
      try {
        origins.push({
          wormholeChainId: wormhole.getWormholeId(),
          originAddress: wormhole.normalizeAddress(
            String(chain.getAssetId(asset))
          ),
        });
      } catch {
        // Address not normalizable for this chain — skip as a candidate.
      }
    }
    return origins;
  }

  async validate(ctx: TransferCtx) {
    const { amount, asset, source, transact } = ctx;

    const emitter = Wormhole.isKnown(source.chain)
      ? source.chain
      : transact && Wormhole.isKnown(transact.chain)
        ? transact.chain
        : undefined;

    if (!emitter) {
      return;
    }

    const wormhole = Wormhole.fromChain(emitter);
    const wormholeChainId = wormhole.getWormholeId();

    let state: WormholeRateLimit;
    try {
      state = await this.governor.getWormholeRateLimit(wormholeChainId);
    } catch {
      throw new TransferValidationError('Wormhole_Governor_Unreachable', {
        chain: emitter.name,
        error: 'wormhole.governorUnreachable',
      });
    }

    if (!state.configured) {
      return;
    }

    if (state.availableNotional <= 0) {
      throw new TransferValidationError('Wormhole_RateLimit_Lockdown', {
        chain: emitter.name,
        enqueuedCount: state.enqueuedCount,
        error: 'wormhole.rateLimitLockdown',
      });
    }

    let notional: number | null;
    try {
      notional = await this.governor.toNotionalUsd(
        this.tokenOrigins(asset),
        amount,
        source.balance.decimals
      );
    } catch {
      throw new TransferValidationError('Wormhole_Governor_Unreachable', {
        chain: emitter.name,
        error: 'wormhole.governorUnreachable',
      });
    }

    // Token not priced by the Governor — only the chain-level lockdown applies.
    if (notional === null) {
      return;
    }

    if (notional > state.maxTransactionSize) {
      throw new TransferValidationError('Wormhole_BigTransaction', {
        asset: asset.originSymbol,
        chain: emitter.name,
        notional,
        maxTransactionSize: state.maxTransactionSize,
        error: 'wormhole.bigTransaction',
      });
    }

    if (notional > state.availableNotional) {
      throw new TransferValidationError('Wormhole_RateLimit_Exceeded', {
        asset: asset.originSymbol,
        chain: emitter.name,
        notional,
        headroom: state.availableNotional,
        limit: state.notionalLimit,
        error: 'wormhole.rateLimitExceeded',
      });
    }
  }
}
