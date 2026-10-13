/** 1Click's estimate of a withdrawal. */
export interface OneClickQuote {
  /** Delivered on the destination, smallest unit. */
  amountOut: bigint;
  /** Kept by 1Click, smallest unit. */
  fee: bigint;
  /** Why 1Click refuses it; empty when viable. */
  errors: string[];
  /** Smallest amount 1Click takes; with an amount-too-low error. */
  minAmount?: bigint;
}

/** A firm 1Click quote: the account the withdrawal pays. */
export interface OneClickDeposit {
  /** NEAR account 1Click watches for the deposit. */
  depositAddress: string;
  correlationId: string;
  /** ISO timestamp the deposit address stops accepting. */
  deadline: string;
}

export interface OneClickWithdrawalParams {
  /** Smallest unit. */
  amount: bigint;
  /** Address on the destination. */
  recipient: string;
  /** NEAR account a refused deposit is refunded to. */
  refundTo?: string;
}

/** 1Click client of withdrawals from NEAR, registered on the destination. */
export interface OneClickClient {
  /** Dry quote; opens nothing. */
  quote(params: OneClickWithdrawalParams): Promise<OneClickQuote>;
  /** Firm quote; opens a deposit address. */
  openDeposit(
    params: Required<OneClickWithdrawalParams>
  ): Promise<OneClickDeposit>;
}
