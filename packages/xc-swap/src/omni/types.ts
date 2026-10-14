export type OmniUtxoChain = 'zcash';

export interface OmniConnector {
  /** Connector contract on NEAR. */
  account: string;
  /** NEAR token a deposit is minted as. */
  token: string;
  /** Smallest unit; a smaller deposit is neither minted nor refunded. */
  minDeposit: bigint;
}

/** Connector's `get_config` view, raw. */
export interface OmniConnectorConfig {
  min_deposit_amount: string;
  refund_timelock_sec: number;
}

/** Order Omni derives the deposit address from. */
export interface OmniDepositOrder {
  chain: OmniUtxoChain;
  /** NEAR account the deposit is delivered to. */
  recipient: string;
  /** `ft_transfer_call` msg, byte for byte. */
  msg: string;
  /** Source chain address a refused deposit is refunded to. */
  refundAddress: string;
}

/** Omni bridge client: orders deposit addresses, reads the connector. */
export interface OmniClient {
  getConnector(chain: OmniUtxoChain): OmniConnector;
  getConnectorConfig(chain: OmniUtxoChain): Promise<OmniConnectorConfig>;
  /** Registers the order; the address is checked against the connector. */
  getDepositAddress(order: OmniDepositOrder): Promise<string>;
}
