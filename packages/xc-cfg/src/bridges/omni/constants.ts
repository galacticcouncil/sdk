/** Omni bridge (NEAR One) mainnet api. */
export const OMNI_BRIDGE_API = 'https://mainnet.api.bridge.nearone.org/api/v3';

/** NEAR MPC signer withdraw accounts derive under, Ed25519 domain. */
export const OMNI_MPC_SIGNER = 'v1.signer';
export const OMNI_MPC_DOMAIN = 1;

/**
 * NEAR account a failed publish of a deposit refunds to.
 *
 * - The depositor has no NEAR account; the DAO pays them back by hand
 * - Registered on every connector token
 */
export const OMNI_REFUND_TO = 'hydration.sputnik-dao.near';

/** Omni's name of a UTXO chain. */
export type OmniUtxoChain = 'zcash';

/**
 * Our withdraw leg of a connector: Hydration → the UTXO chain.
 *
 * - The emitter settles over ntt to a NEAR account derived from the address
 * - The withdraw contract signs that account's withdrawal to the address
 */
export interface OmniWithdrawal {
  /** `UtxoEmitter` on Hydration. */
  emitter: string;
  /** `UtxoWithdraw` on NEAR, the derivation predecessor. */
  contract: string;
  /** Connector's `min_withdraw_amount`, smallest unit. */
  minWithdraw: bigint;
  /** Miner fee the withdraw contract fixes, smallest unit. */
  minerFee: bigint;
}

export interface OmniConnector {
  /** Omni's name of the chain. */
  chain: OmniUtxoChain;
  /** Connector contract on NEAR. */
  account: string;
  /** NEAR token a deposit is minted as. */
  token: string;
  /** Smallest unit; a smaller deposit is neither minted nor refunded. */
  minDeposit: bigint;
  withdrawal: OmniWithdrawal;
}

/** Mainnet connectors, by chain key; `minDeposit` mirrors `min_deposit_amount`. */
export const OMNI_CONNECTORS: Record<string, OmniConnector> = {
  zec: {
    chain: 'zcash',
    account: 'zcash-connector.bridge.near',
    token: 'zec.omft.near',
    minDeposit: 100_000n,
    withdrawal: {
      emitter: '0xb3e365a6241683d5d4ef2701de6bedc16dcc259e',
      contract: 'withdraw-zec.hydration-whm.near',
      minWithdraw: 100_000n,
      // ZIP-317: one input, two outputs is always 2 × 5,000 zat
      minerFee: 10_000n,
    },
  },
};
