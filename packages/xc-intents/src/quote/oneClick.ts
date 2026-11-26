import {
  OneClickService,
  OpenAPI,
  QuoteRequest,
} from '@defuse-protocol/one-click-sdk-typescript';

import { getAddress, isAddress, type Hex } from 'viem';

export interface OneClickConfig {
  baseUrl?: string;
  jwt?: string;
}

const DEFAULT_DISTRIBUTION_CHANNEL =
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjIwMjUtMDEtMTItdjEifQ.eyJ2IjoxLCJrZXlfdHlwZSI6ImRpc3RyaWJ1dGlvbl9jaGFubmVsIiwicGFydG5lcl9pZCI6Imh5ZHJhdGlvbiIsImlhdCI6MTc4MTg3MjQzNywiZXhwIjoxODEzNDA4NDM3fQ.JOLeSM9F4PiyCCpT2xsoLm3hsS77hT4JjyNVxw_8PpENkIKsLFtSpTPUH6eN2cmSXtuAGiJ9UV44anBHL76j19uYvTqZaJNTDoRMB0oUd6WNKiaQJQXs2UmjYOOKNNvBlQU-i8H7bw5tN_yf-rzKuuj-VRNU6TcAhNDkhnWnFChFG4UTd-9V4Ktd5stAFX1VdaWDW9ueBQDkF-dcmrjXBlM44G2UTy3HP65XvzIhYpIRv_CusUkBTipk8nHnkdjXtFBuds2okzI875LLRzf8ANx3HBzdjZsuHbHeBLIPwZcueV2KkkfeEoa2bLRnaXS3IfIhY13N666wyeea0HvUvA';

/** A deposit lives as long as the terms may: past any deadline they carry. */
const DEPOSIT_DEADLINE = '2038-01-01T00:00:00.000Z';

/** Apply 1Click client configuration (base URL + optional JWT). */
export function configureOneClick(config: OneClickConfig = {}): void {
  if (config.baseUrl) OpenAPI.BASE = config.baseUrl;
  if (config.jwt) {
    OpenAPI.TOKEN = config.jwt;
  } else {
    OpenAPI.TOKEN = DEFAULT_DISTRIBUTION_CHANNEL;
  }
}

/** 1Click deposit crediting an intents account, as 1Click quotes it. */
export interface OneClickDeposit {
  /** Ethereum deposit address */
  address: string;
  /** Intents account the quote delivers to */
  recipient: string;
  /** Intents account the quote refunds to */
  refundTo: string;
}

/**
 * Makes the 1Click deposit crediting an intents account.
 *
 * - Any input, no swap: whatever lands on the address is credited as is
 * - One standing address per account
 *
 * @param account - intents account, the deposit account `A`
 * @throws when 1Click returns no Ethereum address
 */
export async function oneClickDeposit(
  account: string
): Promise<OneClickDeposit> {
  const { quote, quoteRequest } = await OneClickService.getQuote({
    dry: false,
    swapType: QuoteRequest.swapType.ANY_INPUT,
    slippageTolerance: 50,
    originAsset: '1cs_v1:any',
    depositType: QuoteRequest.depositType.INTENTS,
    destinationAsset: '1cs_v1:original',
    amount: '0',
    refundTo: account,
    refundType: QuoteRequest.refundType.INTENTS,
    recipient: account,
    recipientType: QuoteRequest.recipientType.INTENTS,
    deadline: DEPOSIT_DEADLINE,
  });

  const { chainDepositAddresses = [] } = quote as {
    chainDepositAddresses?: { blockchain: string; address: string }[];
  };
  const eth = chainDepositAddresses.find((c) => c.blockchain === 'eth');
  if (!eth)
    throw new Error(`1Click returned no Ethereum deposit for ${account}`);

  return {
    address: eth.address,
    recipient: quoteRequest.recipient,
    refundTo: quoteRequest.refundTo,
  };
}

/**
 * Deposit address of a 1Click deposit, once it is shown to credit `A`.
 *
 * - Nothing on-chain binds the address to the terms, so the quote is checked here
 *
 * @param deposit - 1Click deposit
 * @param account - deposit account `A`
 * @throws when the quote names another account or no address
 */
export function depositAddressOf(
  deposit: OneClickDeposit,
  account: string
): Hex {
  if (deposit.recipient !== account || deposit.refundTo !== account) {
    throw new Error(
      `1Click deposit does not credit ${account}: recipient ${deposit.recipient}, refund ${deposit.refundTo}`
    );
  }
  if (!isAddress(deposit.address, { strict: false })) {
    throw new Error(`1Click deposit is no EVM address: ${deposit.address}`);
  }
  return getAddress(deposit.address) as Hex;
}
