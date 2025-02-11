import type {
  PalletEmaOracleOracleEntry,
  PalletDynamicFeesFeeEntry,
  PalletOmnipoolAssetState,
} from '@polkadot/types/lookup';
import { UnsubscribePromise } from '@polkadot/api-base/types';
import { encodeAddress } from '@polkadot/util-crypto';
import { stringToU8a } from '@polkadot/util';
import { ITuple } from '@polkadot/types-codec/types';
import { Option, u32 } from '@polkadot/types-codec';

import {
  HUB_ASSET_ID,
  HYDRADX_SS58_PREFIX,
  SYSTEM_ASSET_ID,
} from '../../consts';
import { bnum } from '../../utils/bignumber';
import { toPct, toPoolFee } from '../../utils/mapper';
import {
  PoolBase,
  PoolType,
  PoolToken,
  PoolLimits,
  PoolFees,
  PoolPair,
} from '../../types';

import { OmniMath } from './OmniMath';
import { OmniPoolFees, OmniPoolToken } from './OmniPool';

import { PoolClient } from '../PoolClient';

type OmniPoolFeeRange = [number, number, number];

export class OmniPoolClient extends PoolClient {
  isSupported(): boolean {
    return this.api.query.omnipool !== undefined;
  }

  async loadPools(): Promise<PoolBase[]> {
    const hubAssetId = this.api.consts.omnipool.hubAssetId.toString();
    const poolAddress = this.getPoolId();

    const [assets, hubAssetTradeability, hubAssetBalance] = await Promise.all([
      this.api.query.omnipool.assets.entries(),
      this.api.query.omnipool.hubAssetTradability(),
      this.getBalance(poolAddress, hubAssetId),
    ]);

    const poolTokens = assets.map(
      async ([
        {
          args: [id],
        },
        state,
      ]) => {
        const {
          hubReserve,
          shares,
          tradable,
          cap,
          protocolShares,
        }: PalletOmnipoolAssetState = state.unwrap();
        const balance = await this.getBalance(poolAddress, id.toString());
        return {
          id: id.toString(),
          hubReserves: bnum(hubReserve.toString()),
          shares: bnum(shares.toString()),
          tradeable: tradable.bits.toNumber(),
          balance: balance.toString(),
          cap: bnum(cap.toString()),
          protocolShares: bnum(protocolShares.toString()),
        } as OmniPoolToken;
      }
    );

    const tokens = await Promise.all(poolTokens);

    // Adding LRNA info
    tokens.push({
      id: hubAssetId,
      tradeable: hubAssetTradeability.bits.toNumber(),
      balance: hubAssetBalance.toString(),
    } as OmniPoolToken);

    return [
      {
        address: poolAddress,
        type: PoolType.Omni,
        hubAssetId: hubAssetId,
        tokens: tokens,
        ...this.getPoolLimits(),
      } as PoolBase,
    ];
  }

  async getPoolFees(poolPair: PoolPair, _address: string): Promise<PoolFees> {
    const feeAsset = poolPair.assetOut;
    const protocolAsset = poolPair.assetIn;

    const oraclePool = 'omnipool';
    const oraclePeriod = 'Short';

    const oracleKey = (asset: string) => {
      return asset === SYSTEM_ASSET_ID
        ? [SYSTEM_ASSET_ID, HUB_ASSET_ID]
        : [HUB_ASSET_ID, asset];
    };

    const [blockNumber, dynamicFees, oracleAssetFee, oracleProtocolFee] =
      await Promise.all([
        this.api.query.system.number(),
        this.api.query.dynamicFees.assetFee(feeAsset),
        this.api.query.emaOracle.oracles<
          Option<ITuple<[PalletEmaOracleOracleEntry, u32]>>
        >(oraclePool, oracleKey(feeAsset), oraclePeriod),
        this.api.query.emaOracle.oracles<
          Option<ITuple<[PalletEmaOracleOracleEntry, u32]>>
        >(oraclePool, oracleKey(protocolAsset), oraclePeriod),
      ]);

    const [assetFeeMin, assetFee, assetFeeMax] = this.getAssetFee(
      poolPair,
      blockNumber.toNumber(),
      dynamicFees,
      oracleAssetFee
    );

    const [protocolFeeMin, protocolFee, protocolFeeMax] =
      protocolAsset === HUB_ASSET_ID
        ? [0, 0, 0] // No protocol fee for LRNA sell
        : this.getProtocolFee(
            poolPair,
            blockNumber.toNumber(),
            dynamicFees,
            oracleProtocolFee
          );

    const min = assetFeeMin + protocolFeeMin;
    const max = assetFeeMax + protocolFeeMax;

    console.log(assetFee, protocolFee);

    return {
      assetFee: toPoolFee(assetFee),
      protocolFee: toPoolFee(protocolFee),
      min: toPoolFee(min),
      max: toPoolFee(max),
    } as OmniPoolFees;
  }

  getPoolType(): PoolType {
    return PoolType.Omni;
  }

  async subscribePoolChange(pool: PoolBase): UnsubscribePromise {
    const assetsArgs = pool.tokens.map((t) => t.id);
    return this.api.query.omnipool.assets.multi(assetsArgs, (states) => {
      pool.tokens = states.map((state, i) => {
        const token = pool.tokens[i];
        if (state.isNone) return token;
        const unwrapped: PalletOmnipoolAssetState = state.unwrap();
        return this.updateTokenState(token, unwrapped);
      });
    });
  }

  private updateTokenState(
    token: PoolToken,
    tokenState: PalletOmnipoolAssetState
  ) {
    const { hubReserve, shares, tradable, cap, protocolShares } = tokenState;
    return {
      ...token,
      hubReserves: bnum(hubReserve.toString()),
      shares: bnum(shares.toString()),
      cap: bnum(cap.toString()),
      protocolShares: bnum(protocolShares.toString()),
      tradeable: tradable.bits.toNumber(),
    } as OmniPoolToken;
  }

  private getAssetFee(
    poolPair: PoolPair,
    blockNumber: number,
    dynamicFee: Option<PalletDynamicFeesFeeEntry>,
    oracle: Option<ITuple<[PalletEmaOracleOracleEntry, u32]>>
  ): OmniPoolFeeRange {
    const { assetOut, balanceOut } = poolPair;

    const { minFee, maxFee, decay, amplification } =
      this.api.consts.dynamicFees.assetFeeParameters;

    const feeMin = toPoolFee(minFee.toNumber());
    const feeMax = toPoolFee(maxFee.toNumber());

    if (dynamicFee.isNone || oracle.isNone) {
      return [minFee.toNumber(), minFee.toNumber(), maxFee.toNumber()];
    }

    const [entry] = oracle.unwrap();
    const { assetFee, timestamp } = dynamicFee.unwrap();

    const blockDifference = blockNumber - timestamp.toNumber();

    let oracleAmountIn = entry.volume.bIn.toString();
    let oracleAmountOut = entry.volume.bOut.toString();
    let oracleLiquidity = entry.liquidity.b.toString();

    if (assetOut === SYSTEM_ASSET_ID) {
      oracleAmountIn = entry.volume.aIn.toString();
      oracleAmountOut = entry.volume.aOut.toString();
      oracleLiquidity = entry.liquidity.a.toString();
    }

    const feePrev = toPoolFee(assetFee.toNumber());
    const fee = OmniMath.recalculateAssetFee(
      oracleAmountIn,
      oracleAmountOut,
      oracleLiquidity,
      '9',
      balanceOut.toString(),
      toPct(feePrev).toString(),
      blockDifference.toString(),
      toPct(feeMin).toString(),
      toPct(feeMax).toString(),
      decay.toString(),
      amplification.toString()
    );
    return [minFee.toNumber(), Number(fee) * 10000, maxFee.toNumber()];
  }

  private getProtocolFee(
    poolPair: PoolPair,
    blockNumber: number,
    dynamicFee: Option<PalletDynamicFeesFeeEntry>,
    oracle: Option<ITuple<[PalletEmaOracleOracleEntry, u32]>>
  ): OmniPoolFeeRange {
    const { assetIn, balanceIn } = poolPair;

    const { minFee, maxFee, decay, amplification } =
      this.api.consts.dynamicFees.protocolFeeParameters;

    const feeMin = toPoolFee(minFee.toNumber());
    const feeMax = toPoolFee(maxFee.toNumber());

    if (dynamicFee.isNone || oracle.isNone) {
      return [minFee.toNumber(), minFee.toNumber(), maxFee.toNumber()];
    }

    const [entry] = oracle.unwrap();
    const { protocolFee, timestamp } = dynamicFee.unwrap();

    const blockDifference = blockNumber - timestamp.toNumber();

    let oracleAmountIn = entry.volume.bIn.toString();
    let oracleAmountOut = entry.volume.bOut.toString();
    let oracleLiquidity = entry.liquidity.b.toString();

    if (assetIn === SYSTEM_ASSET_ID) {
      oracleAmountIn = entry.volume.aIn.toString();
      oracleAmountOut = entry.volume.aOut.toString();
      oracleLiquidity = entry.liquidity.a.toString();
    }

    const feePrev = toPoolFee(protocolFee.toNumber());
    const fee = OmniMath.recalculateProtocolFee(
      oracleAmountIn,
      oracleAmountOut,
      oracleLiquidity,
      '9',
      balanceIn.toString(),
      toPct(feePrev).toString(),
      blockDifference.toString(),
      toPct(feeMin).toString(),
      toPct(feeMax).toString(),
      decay.toString(),
      amplification.toString()
    );
    return [minFee.toNumber(), Number(fee) * 10000, maxFee.toNumber()];
  }

  private getPoolId(): string {
    return encodeAddress(
      stringToU8a('modlomnipool'.padEnd(32, '\0')),
      HYDRADX_SS58_PREFIX
    );
  }

  private getPoolLimits(): PoolLimits {
    const maxInRatio = this.api.consts.omnipool.maxInRatio.toJSON() as number;
    const maxOutRatio = this.api.consts.omnipool.maxOutRatio.toJSON() as number;
    const minTradingLimit =
      this.api.consts.omnipool.minimumTradingLimit.toJSON() as number;
    return {
      maxInRatio: maxInRatio,
      maxOutRatio: maxOutRatio,
      minTradingLimit: minTradingLimit,
    } as PoolLimits;
  }
}
