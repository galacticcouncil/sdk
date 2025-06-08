import { ApiPromise } from '@polkadot/api';

import { EvmClient } from '../evm';
import { Trade, TradeOrder } from '../sor';

import { TradeTxBuilder } from './TradeTxBuilder';
import { OrderTxBuilder } from './OrderTxBuilder';

export class TxBuilderFactory {
  private api: ApiPromise;
  private evmClient: EvmClient;

  constructor(api: ApiPromise, evmClient?: EvmClient) {
    this.api = api;
    this.evmClient = evmClient ?? new EvmClient();
  }

  trade(trade: Trade): TradeTxBuilder {
    return new TradeTxBuilder(this.api, this.evmClient).setTrade(trade);
  }

  order(order: TradeOrder): OrderTxBuilder {
    return new OrderTxBuilder(this.api, this.evmClient).setOrder(order);
  }
}
