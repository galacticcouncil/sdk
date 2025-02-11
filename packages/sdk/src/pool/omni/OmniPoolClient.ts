import type {
  PalletEmaOracleOracleEntry,
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
  PoolFee,
  PoolToken,
  PoolLimits,
  PoolFees,
  PoolPair,
} from '../../types';

import { OmniMath } from './OmniMath';
import { OmniPoolFees, OmniPoolToken } from './OmniPool';

import { PoolClient } from '../PoolClient';

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
    const feeAssetBalance = poolPair.balanceOut;
    const protocolAsset = poolPair.assetIn;
    const protocolAssetBalance = poolPair.balanceIn;

    const oraclePool = 'omnipool';
    const oraclePeriod = 'Short';
    const oraclePeriodNo = '9';

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

    const afp = this.api.consts.dynamicFees.assetFeeParameters;
    const pfp = this.api.consts.dynamicFees.protocolFeeParameters;
    const min = afp.minFee.toNumber() + pfp.minFee.toNumber();
    const max = afp.maxFee.toNumber() + pfp.maxFee.toNumber();

    if (dynamicFees.isSome) {
      const { assetFee, protocolFee, timestamp } = dynamicFees.unwrap();

      const [afoEntry] = oracleAssetFee.unwrap();
      const [pfoEntry] = oracleProtocolFee.unwrap();

      const blockDifference = blockNumber.toNumber() - timestamp.toNumber();

      let afoAmountIn = afoEntry.volume.bIn.toString();
      let afoAmountOut = afoEntry.volume.bOut.toString();
      let afoLiquidity = afoEntry.liquidity.b.toString();

      let pfoAmountIn = pfoEntry.volume.bIn.toString();
      let pfoAmountOut = pfoEntry.volume.bOut.toString();
      let pfoLiquidity = pfoEntry.liquidity.b.toString();

      if (feeAsset === SYSTEM_ASSET_ID) {
        afoAmountIn = afoEntry.volume.aIn.toString();
        afoAmountOut = afoEntry.volume.aOut.toString();
        afoLiquidity = afoEntry.liquidity.a.toString();
      }

      if (protocolAsset === SYSTEM_ASSET_ID) {
        pfoAmountIn = pfoEntry.volume.aIn.toString();
        pfoAmountOut = pfoEntry.volume.aOut.toString();
        pfoLiquidity = pfoEntry.liquidity.a.toString();
      }

      const assetPf = toPoolFee(assetFee.toNumber());
      const assetMinPf = toPoolFee(afp.minFee.toNumber());
      const assetMaxPf = toPoolFee(afp.maxFee.toNumber());

      const protocolPf = toPoolFee(protocolFee.toNumber());
      const protocolMinPf = toPoolFee(pfp.minFee.toNumber());
      const protocolMaxPf = toPoolFee(pfp.maxFee.toNumber());

      const af = OmniMath.recalculateAssetFee(
        afoAmountIn,
        afoAmountOut,
        afoLiquidity,
        oraclePeriodNo,
        feeAssetBalance.toString(),
        toPct(assetPf).toString(),
        blockDifference.toString(),
        toPct(assetMinPf).toString(),
        toPct(assetMaxPf).toString(),
        afp.decay.toString(),
        afp.amplification.toString()
      );
      const afNo = Number(af) * 10000;

      const pf = OmniMath.recalculateProtocolFee(
        pfoAmountIn,
        pfoAmountOut,
        pfoLiquidity,
        oraclePeriodNo,
        protocolAssetBalance.toString(),
        toPct(protocolPf).toString(),
        blockDifference.toString(),
        toPct(protocolMinPf).toString(),
        toPct(protocolMaxPf).toString(),
        pfp.decay.toString(),
        pfp.amplification.toString()
      );
      const pfNo = Number(pf) * 10000;

      return {
        assetFee: toPoolFee(afNo),
        protocolFee: toPoolFee(pfNo),
        min: toPoolFee(min),
        max: toPoolFee(max),
      } as OmniPoolFees;
    } else {
      return {
        assetFee: this.getAssetFee(),
        protocolFee: this.getProtocolFee(),
        min: toPoolFee(min),
        max: toPoolFee(max),
      } as OmniPoolFees;
    }
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

  private getAssetFee(): PoolFee {
    const assetFee = this.api.consts.dynamicFees.assetFeeParameters;
    const assetFeeNo = assetFee.minFee.toNumber();
    return toPoolFee(assetFeeNo);
  }

  private getProtocolFee(): PoolFee {
    const protocolFee = this.api.consts.dynamicFees.protocolFeeParameters;
    const protocolFeeNo: number = protocolFee.minFee.toNumber();
    return toPoolFee(protocolFeeNo);
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
