import {
  buildRoute,
  PoolService,
  PoolType,
  TradeRouter,
} from '@galacticcouncil/sdk';
import {
  AnyChain,
  AssetAmount,
  ChainEcosystem,
  ConfigService,
  FeeSwap,
  Parachain,
  TransferData,
} from '@galacticcouncil/xcm-core';

const isHydration = (c: AnyChain) =>
  c instanceof Parachain &&
  c.ecosystem === ChainEcosystem.Polkadot &&
  c.parachainId === 2034;

const isBasilisk = (c: AnyChain) =>
  c instanceof Parachain &&
  c.ecosystem === ChainEcosystem.Kusama &&
  c.parachainId === 2090;

const IS_DEX = (c: AnyChain) => isHydration(c) || isBasilisk(c);

const IS_HUB = (c: AnyChain) =>
  c instanceof Parachain && c.parachainId === 1000;

const SLIPPAGE_PCT = 30n;

export class Dex {
  readonly chain: Parachain;
  readonly router: TradeRouter;

  constructor(configService: ConfigService, poolService: PoolService) {
    const chains = configService.chains.values();
    const dex = Array.from(chains).find(IS_DEX);
    if (dex) {
      this.chain = dex as Parachain;
    } else {
      throw new Error('DEX parachain config is missing');
    }

    this.router = new TradeRouter(poolService, {
      includeOnly: [PoolType.Omni, PoolType.Stable],
    });
  }

  isSwapSupported(transferData: TransferData): boolean {
    const { asset, source, destination } = transferData;
    const isSupported = IS_HUB(source.chain) || IS_DEX(source.chain);
    const isSufficientAssetTransfer = asset.isEqual(destination.fee);
    return isSupported || !isSufficientAssetTransfer;
  }

  async calculateFeeSwap(
    fee: AssetAmount,
    transferData: TransferData
  ): Promise<FeeSwap> {
    const { source, destination } = transferData;
    const assetIn = this.chain.getMetadataAssetId(fee);
    const assetOut = this.chain.getMetadataAssetId(destination.fee);
    const amountOut = destination.fee.toDecimal(destination.fee.decimals);

    const trade = await this.router.getBestBuy(
      assetIn.toString(),
      assetOut.toString(),
      amountOut
    );

    const amount = BigInt(trade.amountIn.toNumber());
    const maxAmountIn = amount * 2n; // Cover slippage up to 100%

    const hasNotEnoughDestFee =
      destination.feeBalance.amount < destination.fee.amount;
    const hasEnoughReservesToSwap =
      source.feeBalance.amount - fee.amount > maxAmountIn;

    return {
      amount: amount,
      enabled: hasNotEnoughDestFee && hasEnoughReservesToSwap,
      route: buildRoute(trade.swaps),
    } as FeeSwap;
  }
}
