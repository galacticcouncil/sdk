import { PolkadotClient } from 'polkadot-api';

import { AaveUtils } from '../aave';
import { BlockAt } from '../api';
import { Erc20Client } from '../client/Erc20Client';
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
  private aave: AaveUtils;

  /**
   * @param client - papi client
   * @param evmClient - EVM client
   * @param at - block to read at
   * @param aave - shared Aave utils; one per factory when omitted
   */
  constructor(
    client: PolkadotClient,
    evmClient: EvmClient,
    at?: BlockAt,
    aave?: AaveUtils
  ) {
    this.client = client;
    this.evmClient = evmClient;
    this.at = at;
    this.aave = aave ?? new AaveUtils(evmClient, new Erc20Client(client));
  }

  trade(trade: Trade): TradeTxBuilder {
    return new TradeTxBuilder(
      this.client,
      this.evmClient,
      this.at,
      this.aave
    ).setTrade(trade);
  }

  order(order: TradeOrder): OrderTxBuilder {
    return new OrderTxBuilder(
      this.client,
      this.evmClient,
      this.at,
      this.aave
    ).setOrder(order);
  }

  intentMarket(trade: Trade): IntentMarketTxBuilder {
    return new IntentMarketTxBuilder(
      this.client,
      this.evmClient,
      undefined,
      this.aave
    ).setTrade(trade);
  }

  intentLimit(trade: Trade): IntentLimitTxBuilder {
    return new IntentLimitTxBuilder(
      this.client,
      this.evmClient,
      undefined,
      this.aave
    ).setTrade(trade);
  }

  intentOrder(order: TradeOrder): IntentOrderTxBuilder {
    return new IntentOrderTxBuilder(
      this.client,
      this.evmClient,
      undefined,
      this.aave
    ).setOrder(order);
  }
}
