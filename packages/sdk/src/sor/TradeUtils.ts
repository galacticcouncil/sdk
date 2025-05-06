import { ApiPromise } from '@polkadot/api';
import { SubmittableExtrinsic } from '@polkadot/api/promise/types';

import { encodeFunctionData } from 'viem';

import { PolkadotApiClient, Transaction } from '../api';
import { BalanceClient } from '../client';
import {
  AAVE_ABI,
  AAVE_GAS_LIMIT,
  AAVE_PROXY,
  AAVE_ROUNDING_THRESHOLD,
  AAVE_UINT_256_MAX,
  EvmClient,
} from '../evm';
import { Hop, PoolType } from '../pool';

import { ERC20 } from '../utils/erc20';
import { H160 } from '../utils/h160';
import { getFraction } from '../utils/math';

import { Swap, Trade, TradeType } from './types';

export class TradeUtils extends PolkadotApiClient {
  private balanceClient: BalanceClient;
  private evmClient: EvmClient;

  constructor(api: ApiPromise) {
    super(api);
    this.balanceClient = new BalanceClient(api);
    this.evmClient = new EvmClient();
  }

  buildBuyTx(trade: Trade, slippagePct = 1): Transaction {
    if (trade.type !== TradeType.Buy) throw new Error('Not permitted');

    const { amountIn, amountOut, swaps } = trade;

    const firstSwap = swaps[0];
    const lastSwap = swaps[swaps.length - 1];

    const slippage = getFraction(amountIn, slippagePct);

    const assetIn = firstSwap.assetIn;
    const assetOut = lastSwap.assetOut;
    const maxAmountIn = amountIn.plus(slippage);

    let tx: SubmittableExtrinsic;

    if (this.isDirectOmnipoolTrade(swaps)) {
      tx = this.api.tx.omnipool.buy(
        assetOut,
        assetIn,
        amountOut.toFixed(),
        maxAmountIn.toFixed()
      );
    } else {
      tx = this.api.tx.router.buy(
        assetIn,
        assetOut,
        amountOut.toFixed(),
        maxAmountIn.toFixed(),
        this.buildRoute(swaps)
      );
    }

    return {
      hex: tx.toHex(),
      name: 'RouterBuy',
      get: () => tx,
      dryRun: (account: string) => this.dryRun(account, tx),
    } as Transaction;
  }

  buildSellTx(trade: Trade, slippagePct = 1): Transaction {
    if (trade.type !== TradeType.Sell) throw new Error('Not permitted');

    const { amountIn, amountOut, swaps } = trade;

    const firstSwap = swaps[0];
    const lastSwap = swaps[swaps.length - 1];

    const slippage = getFraction(amountOut, slippagePct);

    const assetIn = firstSwap.assetIn;
    const assetOut = lastSwap.assetOut;
    const minAmountOut = amountOut.minus(slippage);

    let tx: SubmittableExtrinsic;

    if (this.isDirectOmnipoolTrade(swaps)) {
      tx = this.api.tx.omnipool.sell(
        assetIn,
        assetOut,
        amountIn.toFixed(),
        minAmountOut.toFixed()
      );
    } else {
      tx = this.api.tx.router.sell(
        assetIn,
        assetOut,
        amountIn.toFixed(),
        minAmountOut.toFixed(),
        this.buildRoute(swaps)
      );
    }

    return {
      hex: tx.toHex(),
      name: 'RouterSell',
      get: () => tx,
      dryRun: (account: string) => this.dryRun(account, tx),
    } as Transaction;
  }

  buildSellAllTx(trade: Trade, slippagePct = 1): Transaction {
    if (trade.type !== TradeType.Sell) throw new Error('Not permitted');

    const { amountOut, swaps } = trade;

    const firstSwap = swaps[0];
    const lastSwap = swaps[swaps.length - 1];

    const slippage = getFraction(amountOut, slippagePct);

    const assetIn = firstSwap.assetIn;
    const assetOut = lastSwap.assetOut;
    const minAmountOut = amountOut.minus(slippage);

    const tx: SubmittableExtrinsic = this.api.tx.router.sellAll(
      assetIn,
      assetOut,
      minAmountOut.toFixed(),
      this.buildRoute(swaps)
    );

    return {
      hex: tx.toHex(),
      name: 'RouterSellAll',
      get: () => tx,
      dryRun: (account: string) => this.dryRun(account, tx),
    } as Transaction;
  }

  async buildWithdrawAndSellReserveTx(
    beneficiary: string,
    trade: Trade,
    slippagePct = 1
  ): Promise<Transaction> {
    const { amountIn, amountOut, swaps } = trade;

    const firstSwap = swaps[0];
    const lastSwap = swaps[swaps.length - 1];

    if (!firstSwap.isWithdraw()) throw new Error('Not permitted');

    const aToken = firstSwap.assetIn;
    const reserve = firstSwap.assetOut;

    const [gasPrice, aTokenBalance] = await Promise.all([
      this.evmClient.getProvider().getGasPrice(),
      this.balanceClient.getBalance(beneficiary, aToken),
    ]);

    const isMax = amountIn.isGreaterThanOrEqualTo(
      aTokenBalance.minus(AAVE_ROUNDING_THRESHOLD)
    );

    const gasPriceMargin = (gasPrice * 10n) / 100n;

    const to = H160.fromAny(beneficiary);
    const amount = isMax ? AAVE_UINT_256_MAX : BigInt(amountIn.toFixed());
    const asset = ERC20.fromAssetId(reserve);

    const withdrawCalldata = encodeFunctionData({
      abi: AAVE_ABI,
      functionName: 'withdraw',
      args: [asset as `0x${string}`, amount, to as `0x${string}`],
    });

    const withdrawTx: SubmittableExtrinsic = this.api.tx.evm.call(
      to,
      AAVE_PROXY,
      withdrawCalldata,
      0n,
      AAVE_GAS_LIMIT,
      gasPrice + gasPriceMargin,
      gasPrice + gasPriceMargin,
      null,
      []
    );

    const slippage = getFraction(amountOut, slippagePct);
    const assetIn = reserve;
    const assetOut = lastSwap.assetOut;
    const minAmountOut = amountOut.minus(slippage);

    const reserveSellTx: SubmittableExtrinsic = this.api.tx.router.sell(
      assetIn,
      assetOut,
      amountIn.minus(AAVE_ROUNDING_THRESHOLD).toFixed(),
      minAmountOut.toFixed(),
      this.buildRoute(swaps.slice(1))
    );

    const tx = this.api.tx.utility.batchAll([withdrawTx, reserveSellTx]);
    return {
      hex: tx.toHex(),
      name: 'WithdrawAndRouterReserveSell',
      get: () => tx,
      dryRun: (account: string) => this.dryRun(account, tx),
    } as Transaction;
  }

  buildRoute(swaps: Swap[]) {
    return swaps.map(({ assetIn, assetOut, pool, poolId }: Hop) => {
      if (pool === PoolType.Stable) {
        return {
          pool: {
            Stableswap: poolId,
          },
          assetIn,
          assetOut,
        };
      }
      return {
        pool,
        assetIn,
        assetOut,
      };
    });
  }

  isDirectOmnipoolTrade(swaps: Swap[]): boolean {
    return swaps.length === 1 && swaps[0].pool === PoolType.Omni;
  }
}
