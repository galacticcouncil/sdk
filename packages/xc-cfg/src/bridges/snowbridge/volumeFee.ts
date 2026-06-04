import { Asset, AssetAmount, Dex } from '@galacticcouncil/xc-core';

import { eth, usdc } from '../../assets';

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

// Probe sizes chosen to dwarf rounding while staying well inside any pool's
// effective price range. 100 USDC is plenty to extract a stable spot price.
const USDC_DECIMALS = 6;
const USDC_UNIT = 10n ** BigInt(USDC_DECIMALS);
const USDC_PROBE = 100n * USDC_UNIT;
const ETH_PROBE = WEI; // 1 ETH

/**
 * Compute the Snowbridge V2 volume tip for a transfer, sourcing all USD and
 * ETH spot prices from the supplied Dex (typically Hydration's).
 *
 * Returns 0 when amount is missing or non-positive — the fee builder is
 * called once at preview render with no amount, and we don't want to bill a
 * tip for a phantom transfer.
 */
export async function getVolumeTipInWei(
  dex: Dex,
  transferAsset: Asset,
  transferAmount: bigint
): Promise<bigint> {
  if (transferAmount <= 0n) return 0n;

  try {
    const [txValueUsd, { ethToUsdNumerator, ethToUsdDenominator }] =
      await Promise.all([
        getTxValueUsd(dex, transferAsset, transferAmount),
        getEthUsdRatio(dex),
      ]);

    return calculateVolumeTipInWei({
      txValueUsd,
      ethToUsdNumerator,
      ethToUsdDenominator,
    });
  } catch (e) {
    console.warn(
      `Snowbridge volume tip pricing failed for ${transferAsset.key}; defaulting to 0.`,
      e
    );
    return 0n;
  }
}

async function getTxValueUsd(
  dex: Dex,
  transferAsset: Asset,
  transferAmount: bigint
): Promise<bigint> {
  // Stablecoin shortcut — treat 1:1 with USD.
  if (
    transferAsset.originSymbol === 'USDC' ||
    transferAsset.originSymbol === 'USDT'
  ) {
    const decimals = dex.chain.getAssetDecimals(transferAsset);
    if (decimals === undefined) {
      throw new Error(
        `Snowbridge volume tip: ${transferAsset.key} has no decimals on ${dex.chain.key}`
      );
    }
    return transferAmount / 10n ** BigInt(decimals);
  }

  const probeUsdc = AssetAmount.fromAsset(usdc, {
    amount: USDC_PROBE,
    decimals: USDC_DECIMALS,
  });
  const { amount: transferForProbe } = await dex.getQuote(
    transferAsset,
    usdc,
    probeUsdc
  );

  // transferForProbe (base units of transferAsset) ↔ USDC_PROBE (USDC base)
  // txValueUsdcBase = transferAmount * USDC_PROBE / transferForProbe
  const txValueUsdcBase = (transferAmount * USDC_PROBE) / transferForProbe;
  return txValueUsdcBase / USDC_UNIT;
}

async function getEthUsdRatio(dex: Dex): Promise<{
  ethToUsdNumerator: bigint;
  ethToUsdDenominator: bigint;
}> {
  const probeEth = AssetAmount.fromAsset(eth, {
    amount: ETH_PROBE,
    decimals: 18,
  });
  const { amount: usdcForEth } = await dex.getQuote(usdc, eth, probeEth);
  // 1 ETH (= WEI base units) costs `usdcForEth` USDC-base-units.
  // 1 ETH = usdcForEth / 10^6 USD.
  return {
    ethToUsdNumerator: usdcForEth,
    ethToUsdDenominator: USDC_UNIT,
  };
}
