import { Binary, PolkadotClient } from 'polkadot-api';

import { Papi } from '../api';
import { buildRoute, Hop, PoolType } from '../pool';

export class TxUtils extends Papi {
  constructor(client: PolkadotClient) {
    super(client);
  }

  private isDirectOmnipoolTrade(route: Hop[]) {
    return route.length == 1 && route[0].pool == PoolType.Omni;
  }

  async buildBuyTx(
    assetIn: number,
    assetOut: number,
    amountOut: bigint,
    maxAmountIn: bigint,
    route: Hop[]
  ): Promise<string> {
    let encodedTx: Binary;

    if (this.isDirectOmnipoolTrade(route)) {
      const tx = this.api.tx.Omnipool.buy({
        asset_in: assetIn,
        asset_out: assetOut,
        amount: amountOut,
        max_sell_amount: maxAmountIn,
      });
      encodedTx = await tx.getEncodedData();
    } else {
      const tx = this.api.tx.Router.buy({
        asset_in: assetIn,
        asset_out: assetOut,
        amount_out: amountOut,
        max_amount_in: maxAmountIn,
        route: buildRoute(route),
      });
      encodedTx = await tx.getEncodedData();
    }
    return encodedTx.asHex();
  }

  async buildSellTx(
    assetIn: number,
    assetOut: number,
    amountIn: bigint,
    minAmountOut: bigint,
    route: Hop[]
  ): Promise<string> {
    let encodedTx: Binary;

    if (this.isDirectOmnipoolTrade(route)) {
      const tx = this.api.tx.Omnipool.sell({
        asset_in: assetIn,
        asset_out: assetOut,
        amount: amountIn,
        min_buy_amount: minAmountOut,
      });
      encodedTx = await tx.getEncodedData();
    } else {
      const tx = this.api.tx.Router.sell({
        asset_in: assetIn,
        asset_out: assetOut,
        amount_in: amountIn,
        min_amount_out: minAmountOut,
        route: buildRoute(route),
      });
      encodedTx = await tx.getEncodedData();
    }
    return encodedTx.asHex();
  }
}
