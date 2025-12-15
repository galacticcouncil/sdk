import {
  Abi,
  Asset,
  AssetAmount,
  Dex,
  EvmChain,
  SwapQuote,
} from '@galacticcouncil/xcm-core';

export class UniswapV2Dex implements Dex {
  readonly chain: EvmChain;

  constructor(chain: EvmChain) {
    this.chain = chain;
    this.validateConfig(chain);
  }

  private validateConfig(chain: EvmChain) {
    if (!chain.uniswapV2) {
      throw Error('Uniswap v2 router not supported on ' + chain.name);
    }
  }

  async getCalldata(
    _account: string,
    _assetIn: Asset,
    _assetOut: Asset,
    _amountOut: AssetAmount
  ): Promise<string> {
    throw Error('Not supported for ' + this.chain.key);
  }

  async getQuote(
    assetIn: Asset,
    assetOut: Asset,
    amountOut: AssetAmount
  ): Promise<SwapQuote> {
    const aIn = this.chain.getBalanceAssetId(assetIn);
    const aOut = this.chain.getBalanceAssetId(assetOut);
    const router = this.chain.uniswapV2;

    const v2AmountsIn = await this.chain.client.getProvider().readContract({
      address: router as `0x${string}`,
      abi: Abi.UniswapV2Router,
      functionName: 'getAmountsIn',
      args: [amountOut.amount, [aIn.toString(), aOut.toString()]],
    });

    const amount = v2AmountsIn as bigint[];
    return {
      amount: amount[0],
    } as SwapQuote;
  }
}
