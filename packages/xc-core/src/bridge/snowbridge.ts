import { AnyChain } from '../chain';

export type SnowbridgeDef = {
  id: number;
  gateway: string;
};

export class Snowbridge {
  readonly id: number;
  readonly gateway: string;

  constructor({ id, gateway }: SnowbridgeDef) {
    this.id = id;
    this.gateway = gateway;
  }

  static fromChain(chain: AnyChain): Snowbridge {
    if ('snowbridge' in chain && !!chain['snowbridge']) {
      return chain.snowbridge as Snowbridge;
    }
    throw new Error(chain.name + ' is not supported in Snowbridge.');
  }

  static isKnown(chain: AnyChain): boolean {
    return 'snowbridge' in chain && !!chain['snowbridge'];
  }

  getConsensusId(): number {
    return this.id;
  }

  getGateway(): string {
    return this.gateway;
  }
}

// ---------------------------------------------------------------------------
// V2 Gateway gas budget
// ---------------------------------------------------------------------------

// Two-phase submission is the default; Fiat-Shamir adds a premium that is
// applied at runtime via the SDK acceleration mutator.
export const SNOWBRIDGE_BASE_DISPATCH_GAS = 80_000n;
export const SNOWBRIDGE_BASE_VERIFICATION_GAS = 120_000n;
export const SNOWBRIDGE_SUBMIT_GAS = 1_000_000n;
export const SNOWBRIDGE_FIAT_SHAMIR_GAS = 2_000_000n;

// Ether existential deposit on AssetHub (15 µETH).
export const ASSETHUB_ETHER_ED = 15_000_000_000_000n;

// ---------------------------------------------------------------------------
// V2 volume-based relayer fee schedule
// ---------------------------------------------------------------------------

/**
 * Snowbridge V2 volume-based relayer fee schedule.
 * Direction:
 *  - Ethereum → Polkadot: add the result to `relayerFee` (5th arg of
 *    `v2_sendMessage`).
 *  - Polkadot → Ethereum: add the result to `etherFeeAmount`, which flows
 *    into the AH→Ethereum InitiateTransfer `remote_fees`.
 */

export type FeeBand = {
  lowerUsd: bigint;
  upperUsd: bigint;
  numerator: bigint;
  denominator: bigint;
};

export type VolumeFeeParams = {
  txValueUsd: bigint;
  ethToUsdNumerator: bigint;
  ethToUsdDenominator: bigint;
};

const MAX_USD = 999_999_999_999n;

export const FEE_SCHEDULE: FeeBand[] = [
  { lowerUsd: 0n, upperUsd: 100n, numerator: 16n, denominator: 10_000n },
  { lowerUsd: 100n, upperUsd: 1_000n, numerator: 14n, denominator: 10_000n },
  { lowerUsd: 1_000n, upperUsd: 10_000n, numerator: 12n, denominator: 10_000n },
  {
    lowerUsd: 10_000n,
    upperUsd: 100_000n,
    numerator: 10n,
    denominator: 10_000n,
  },
  {
    lowerUsd: 100_000n,
    upperUsd: 1_000_000n,
    numerator: 8n,
    denominator: 10_000n,
  },
  {
    lowerUsd: 1_000_000n,
    upperUsd: MAX_USD,
    numerator: 6n,
    denominator: 10_000n,
  },
];

export function lookupFeeRatio(txValueUsd: bigint): {
  numerator: bigint;
  denominator: bigint;
} {
  for (const band of FEE_SCHEDULE) {
    if (txValueUsd >= band.lowerUsd && txValueUsd < band.upperUsd) {
      return { numerator: band.numerator, denominator: band.denominator };
    }
  }
  return { numerator: 6n, denominator: 10_000n };
}

const WEI = 1_000_000_000_000_000_000n;

export function calculateVolumeTipInWei(params: VolumeFeeParams): bigint {
  if (params.txValueUsd < 0n) {
    throw new Error('txValueUsd must be >= 0');
  }
  if (params.ethToUsdNumerator <= 0n || params.ethToUsdDenominator <= 0n) {
    throw new Error('ethToUsdNumerator and ethToUsdDenominator must be > 0');
  }
  const { numerator: feeNum, denominator: feeDen } = lookupFeeRatio(
    params.txValueUsd
  );
  return (
    (params.txValueUsd * feeNum * WEI * params.ethToUsdDenominator) /
    (feeDen * params.ethToUsdNumerator)
  );
}
