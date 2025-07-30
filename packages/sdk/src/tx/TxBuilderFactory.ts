import { ApiPromise } from '@polkadot/api';

import { EvmClient } from '../evm';
import { Trade, TradeOrder } from '../sor';

import { TradeTxBuilder } from './TradeTxBuilder';
import { OrderTxBuilder } from './OrderTxBuilder';

export class TxBuilderFactory {
  private api: ApiPromise;
  private evm: EvmClient;

  constructor(api: ApiPromise, evm: EvmClient) {
    this.api = api;
    this.evm = evm;
  }

  trade(trade: Trade): TradeTxBuilder {
    return new TradeTxBuilder(this.api, this.evm).setTrade(trade);
  }

  order(order: TradeOrder): OrderTxBuilder {
    return new OrderTxBuilder(this.api, this.evm).setOrder(order);
  }
}
