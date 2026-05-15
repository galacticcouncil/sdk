import { PoolNotFound } from '../errors';

import { LbpPool, LbpPoolBase, LbpPoolFees, LbpSnapshot } from './lbp';
import { OmniPoolBase, OmniPoolFee, OmniSnapshot, getEmaKey } from './omni';
import { StableSwap, StableSwapBase, StableSwapFees } from './stable';
import { XykPoolFees, XykSnapshot } from './xyk';

import {
  IPoolCtxProvider,
  Pool,
  PoolBase,
  PoolFees,
  PoolPair,
  PoolType,
} from './types';

export interface SnapshotPoolCtx {
  block: number;
  pools: {
    aave: PoolBase[];
    xyk: PoolBase[];
    lbp: LbpPoolBase[];
    stable: StableSwapBase[];
    omni: OmniPoolBase[];
  };
  states: {
    omni: OmniSnapshot;
    xyk: XykSnapshot;
    lbp: LbpSnapshot;
  };
}

export class SnapshotPoolCtxProvider implements IPoolCtxProvider {
  private readonly flat: PoolBase[];

  constructor(private readonly snapshot: SnapshotPoolCtx) {
    const { aave, xyk, lbp, stable, omni } = snapshot.pools;
    this.flat = [...aave, ...xyk, ...lbp, ...stable, ...omni];
  }

  async getPools(): Promise<PoolBase[]> {
    return this.flat;
  }

  async getPoolFees(pair: PoolPair, pool: Pool): Promise<PoolFees> {
    const { block, states } = this.snapshot;

    switch (pool.type) {
      case PoolType.Aave: {
        return {} as PoolFees;
      }

      case PoolType.XYK: {
        const { exchangeFee } = states.xyk;
        return { exchangeFee } as XykPoolFees;
      }

      case PoolType.LBP: {
        const { repayFee } = states.lbp;
        const lbp = pool as LbpPool;
        return {
          exchangeFee: lbp.fee,
          repayFee,
        } as LbpPoolFees;
      }

      case PoolType.Stable: {
        const stable = pool as StableSwap;
        return { fee: stable.fee } as StableSwapFees;
      }

      case PoolType.Omni: {
        const feeAsset = pair.assetOut;
        const protocolAsset = pair.assetIn;

        const {
          dynamicFees,
          emaOracles,
          assetFeeParams,
          protocolFeeParams,
          maxSlipFee,
        } = states.omni;

        const dynamicFee = dynamicFees.find(
          ({ asset }) => asset === feeAsset
        )?.fee;

        const oracleAssetFee = emaOracles.find(
          ({ pair }) => pair.join(':') === getEmaKey(feeAsset)
        )?.oracle;

        const oracleProtocolFee = emaOracles.find(
          ({ pair }) => pair.join(':') === getEmaKey(protocolAsset)
        )?.oracle;

        return OmniPoolFee.compute(
          pair,
          block,
          dynamicFee,
          oracleAssetFee,
          oracleProtocolFee,
          assetFeeParams,
          protocolFeeParams,
          maxSlipFee
        );
      }

      default:
        throw new PoolNotFound(pool.type);
    }
  }
}
