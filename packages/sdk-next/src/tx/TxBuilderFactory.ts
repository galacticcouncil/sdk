import { PolkadotClient } from 'polkadot-api';

import { BlockAt } from '../api';
import { EvmClient } from '../evm';
import { Trade, TradeOrder } from '../sor';

import { TradeTxBuilder } from './TradeTxBuilder';
import { OrderTxBuilder } from './OrderTxBuilder';

import { IntentMarketTxBuilder } from './IntentMarketTxBuilder';
import { IntentLimitTxBuilder } from './IntentLimitTxBuilder';
import { IntentOrderTxBuilder } from './IntentOrderTxBuilder';

export class TxBuilderFactory {
  private client: PolkadotClient;
  private evmClient: EvmClient;
  private at?: BlockAt;

  constructor(client: PolkadotClient, evmClient: EvmClient, at?: BlockAt) {
    this.client = client;
    this.evmClient = evmClient;
    this.at = at;
  }

  trade(trade: Trade): TradeTxBuilder {
    return new TradeTxBuilder(this.client, this.evmClient, this.at).setTrade(
      trade
    );
  }

  order(order: TradeOrder): OrderTxBuilder {
    return new OrderTxBuilder(this.client, this.evmClient, this.at).setOrder(
      order
    );
  }

  intentMarket(trade: Trade): IntentMarketTxBuilder {
    return new IntentMarketTxBuilder(this.client, this.evmClient).setTrade(
      trade
    );
  }

  intentLimit(trade: Trade): IntentLimitTxBuilder {
    return new IntentLimitTxBuilder(this.client, this.evmClient).setTrade(
      trade
    );
  }

  intentOrder(order: TradeOrder): IntentOrderTxBuilder {
    return new IntentOrderTxBuilder(this.client, this.evmClient).setOrder(
      order
    );
  }
}
