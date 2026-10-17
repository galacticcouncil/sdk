import type { AnyChain, Asset } from '@galacticcouncil/xc-core';
import type { Transfer, Wallet } from '@galacticcouncil/xc-sdk';

import type { OmniClient } from '../omni';

/** Construction options for the Zcash transfers. */
export interface ZcashTransfersOpts {
  /** Wallet the Hydration ↔ NEAR leg is built and validated with. */
  wallet: Wallet;
  /**
   * NEAR account a refund on NEAR goes to.
   *
   * - 1Click refunds a failed withdrawal
   * - The NEAR manager refunds a deposit whose publish fails
   * - Must be registered on `zec.omft.near`, or the refund stays with Omni
   */
  refundTo: string;
  /** Omni bridge client. Default the mainnet one. */
  omni?: OmniClient;
}

/** A pair the Zcash transfers serve. */
export interface ZcashPair {
  source: { chain: AnyChain; asset: Asset };
  destination: { chain: AnyChain; asset: Asset };
}

export interface ZcashTransferArgs {
  /** Sender on the source chain. */
  srcAddress: string;
  /** Recipient on the destination chain. */
  dstAddress: string;
}

/** A 1Click deposit address, opened by a firm quote. */
export interface OneClickDeposit {
  /** NEAR implicit account 1Click watches for the deposit. */
  depositAddress: string;
  correlationId: string;
  /** ISO timestamp the deposit address stops accepting. */
  deadline: string;
}

/**
 * A Zcash transfer, in the shape the cross-chain form drives.
 *
 * - A withdrawal's calls pay a 1Click deposit address, opened as they're built
 */
export interface ZcashTransfer extends Transfer {
  /** Deposit a withdrawal pays, once its calls are built. */
  deposit?: OneClickDeposit;
}

export interface ZcashTransfers {
  /** Hydration ZEC → Zcash, and back. */
  readonly pairs: ZcashPair[];
  /** Hydration ZEC → Zcash: ntt to a 1Click deposit address on NEAR. */
  withdraw(args: ZcashTransferArgs): Promise<ZcashTransfer>;
  /** Zcash → Hydration ZEC: an Omni deposit, minted into the NEAR manager. */
  deposit(args: ZcashTransferArgs): Promise<ZcashTransfer>;
}

/** What the transfers are built with. */
export interface ZcashCtx {
  wallet: Wallet;
  refundTo: string;
  omni: OmniClient;
}
