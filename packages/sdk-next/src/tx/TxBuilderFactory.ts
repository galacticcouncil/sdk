import { PolkadotClient } from 'polkadot-api';

import { BlockAt } from '../api';
import { EvmClient } from '../evm';
import { Trade, TradeOrder } from '../sor';

import { TradeTxBuilder } from './TradeTxBuilder';
import { OrderTxBuilder } from './OrderTxBuilder';

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
}
