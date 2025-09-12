import { PolkadotClient } from 'polkadot-api';

import { EvmClient } from '../evm';
import { Trade, TradeOrder } from '../sor';

import { TradeTxBuilder } from './TradeTxBuilder';
import { OrderTxBuilder } from './OrderTxBuilder';

export class TxBuilderFactory {
  private client: PolkadotClient;
  private evmClient: EvmClient;

  constructor(client: PolkadotClient, evmClient: EvmClient) {
    this.client = client;
    this.evmClient = evmClient;
  }

  trade(trade: Trade): TradeTxBuilder {
    return new TradeTxBuilder(this.client, this.evmClient).setTrade(trade);
  }

  order(order: TradeOrder): OrderTxBuilder {
    return new OrderTxBuilder(this.client, this.evmClient).setOrder(order);
  }
}
