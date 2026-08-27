/**
 * One swap step within a single tick range, in native `bigint`.
 *
 * - Ports Uniswap's `SqrtPriceMath` / `SwapMath`
 * - Rounding direction is part of the contract, not an implementation detail:
 *   input amounts round up and output amounts round down, so a quote can never
 *   promise more than the pool would pay
 */

const Q96 = 1n << 96n;
const MAX_UINT256 = (1n << 256n) - 1n;
const MAX_UINT160 = (1n << 160n) - 1n;
const MAX_FEE = 1_000_000n;

/** `a * b / denominator`, rounded up */
function mulDivRoundingUp(a: bigint, b: bigint, denominator: bigint): bigint {
  const product = a * b;
  const result = product / denominator;
  return product % denominator !== 0n ? result + 1n : result;
}

/** token0 moved by a price change over `liquidity` */
export function getAmount0Delta(
  sqrtRatioAX96: bigint,
  sqrtRatioBX96: bigint,
  liquidity: bigint,
  roundUp: boolean
): bigint {
  if (sqrtRatioAX96 > sqrtRatioBX96) {
    [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];
  }

  const numerator1 = liquidity << 96n;
  const numerator2 = sqrtRatioBX96 - sqrtRatioAX96;

  return roundUp
    ? mulDivRoundingUp(
        mulDivRoundingUp(numerator1, numerator2, sqrtRatioBX96),
        1n,
        sqrtRatioAX96
      )
    : (numerator1 * numerator2) / sqrtRatioBX96 / sqrtRatioAX96;
}

/** token1 moved by a price change over `liquidity` */
export function getAmount1Delta(
  sqrtRatioAX96: bigint,
  sqrtRatioBX96: bigint,
  liquidity: bigint,
  roundUp: boolean
): bigint {
  if (sqrtRatioAX96 > sqrtRatioBX96) {
    [sqrtRatioAX96, sqrtRatioBX96] = [sqrtRatioBX96, sqrtRatioAX96];
  }

  const delta = sqrtRatioBX96 - sqrtRatioAX96;
  return roundUp
    ? mulDivRoundingUp(liquidity, delta, Q96)
    : (liquidity * delta) / Q96;
}

function nextSqrtPriceFromAmount0RoundingUp(
  sqrtPX96: bigint,
  liquidity: bigint,
  amount: bigint,
  add: boolean
): bigint {
  if (amount === 0n) return sqrtPX96;

  const numerator1 = liquidity << 96n;

  if (add) {
    const product = (amount * sqrtPX96) & MAX_UINT256;
    if (product / amount === sqrtPX96) {
      const denominator = (numerator1 + product) & MAX_UINT256;
      if (denominator >= numerator1) {
        return mulDivRoundingUp(numerator1, sqrtPX96, denominator);
      }
    }
    return mulDivRoundingUp(numerator1, 1n, numerator1 / sqrtPX96 + amount);
  }

  const product = (amount * sqrtPX96) & MAX_UINT256;
  if (product / amount !== sqrtPX96) throw new Error('v3 swap: price overflow');
  if (numerator1 <= product) throw new Error('v3 swap: price underflow');
  return mulDivRoundingUp(numerator1, sqrtPX96, numerator1 - product);
}

function nextSqrtPriceFromAmount1RoundingDown(
  sqrtPX96: bigint,
  liquidity: bigint,
  amount: bigint,
  add: boolean
): bigint {
  if (add) {
    const quotient =
      amount <= MAX_UINT160
        ? (amount << 96n) / liquidity
        : (amount * Q96) / liquidity;
    return sqrtPX96 + quotient;
  }

  const quotient = mulDivRoundingUp(amount, Q96, liquidity);
  if (sqrtPX96 <= quotient) throw new Error('v3 swap: price underflow');
  return sqrtPX96 - quotient;
}

function nextSqrtPriceFromInput(
  sqrtPX96: bigint,
  liquidity: bigint,
  amountIn: bigint,
  zeroForOne: boolean
): bigint {
  if (sqrtPX96 <= 0n || liquidity <= 0n) {
    throw new Error('v3 swap: empty range');
  }
  return zeroForOne
    ? nextSqrtPriceFromAmount0RoundingUp(sqrtPX96, liquidity, amountIn, true)
    : nextSqrtPriceFromAmount1RoundingDown(sqrtPX96, liquidity, amountIn, true);
}

function nextSqrtPriceFromOutput(
  sqrtPX96: bigint,
  liquidity: bigint,
  amountOut: bigint,
  zeroForOne: boolean
): bigint {
  if (sqrtPX96 <= 0n || liquidity <= 0n) {
    throw new Error('v3 swap: empty range');
  }
  return zeroForOne
    ? nextSqrtPriceFromAmount1RoundingDown(
        sqrtPX96,
        liquidity,
        amountOut,
        false
      )
    : nextSqrtPriceFromAmount0RoundingUp(sqrtPX96, liquidity, amountOut, false);
}

/** `[sqrtRatioNextX96, amountIn, amountOut, feeAmount]` */
export type SwapStep = [bigint, bigint, bigint, bigint];

/**
 * Swap as far as one tick range allows.
 *
 * - `amountRemaining` is positive for exact-in and negative for exact-out
 * - Stops at `sqrtRatioTargetX96` if the range fills the order, otherwise at
 *   the price the order itself reaches
 *
 * @param sqrtRatioCurrentX96 - price the step starts at
 * @param sqrtRatioTargetX96 - range boundary in the traded direction
 * @param liquidity - active liquidity in the range
 * @param amountRemaining - signed amount still to trade
 * @param feePips - pool fee in hundredths of a bip
 */
export function computeSwapStep(
  sqrtRatioCurrentX96: bigint,
  sqrtRatioTargetX96: bigint,
  liquidity: bigint,
  amountRemaining: bigint,
  feePips: number
): SwapStep {
  const fee = BigInt(feePips);
  const zeroForOne = sqrtRatioCurrentX96 >= sqrtRatioTargetX96;
  const exactIn = amountRemaining >= 0n;

  let sqrtRatioNextX96: bigint;
  let amountIn = 0n;
  let amountOut = 0n;

  if (exactIn) {
    const amountRemainingLessFee =
      (amountRemaining * (MAX_FEE - fee)) / MAX_FEE;
    amountIn = zeroForOne
      ? getAmount0Delta(
          sqrtRatioTargetX96,
          sqrtRatioCurrentX96,
          liquidity,
          true
        )
      : getAmount1Delta(
          sqrtRatioCurrentX96,
          sqrtRatioTargetX96,
          liquidity,
          true
        );
    sqrtRatioNextX96 =
      amountRemainingLessFee >= amountIn
        ? sqrtRatioTargetX96
        : nextSqrtPriceFromInput(
            sqrtRatioCurrentX96,
            liquidity,
            amountRemainingLessFee,
            zeroForOne
          );
  } else {
    amountOut = zeroForOne
      ? getAmount1Delta(
          sqrtRatioTargetX96,
          sqrtRatioCurrentX96,
          liquidity,
          false
        )
      : getAmount0Delta(
          sqrtRatioCurrentX96,
          sqrtRatioTargetX96,
          liquidity,
          false
        );
    sqrtRatioNextX96 =
      -amountRemaining >= amountOut
        ? sqrtRatioTargetX96
        : nextSqrtPriceFromOutput(
            sqrtRatioCurrentX96,
            liquidity,
            -amountRemaining,
            zeroForOne
          );
  }

  const max = sqrtRatioTargetX96 === sqrtRatioNextX96;

  if (zeroForOne) {
    amountIn =
      max && exactIn
        ? amountIn
        : getAmount0Delta(
            sqrtRatioNextX96,
            sqrtRatioCurrentX96,
            liquidity,
            true
          );
    amountOut =
      max && !exactIn
        ? amountOut
        : getAmount1Delta(
            sqrtRatioNextX96,
            sqrtRatioCurrentX96,
            liquidity,
            false
          );
  } else {
    amountIn =
      max && exactIn
        ? amountIn
        : getAmount1Delta(
            sqrtRatioCurrentX96,
            sqrtRatioNextX96,
            liquidity,
            true
          );
    amountOut =
      max && !exactIn
        ? amountOut
        : getAmount0Delta(
            sqrtRatioCurrentX96,
            sqrtRatioNextX96,
            liquidity,
            false
          );
  }

  // Never pay out more than an exact-out order asked for.
  if (!exactIn && amountOut > -amountRemaining) {
    amountOut = -amountRemaining;
  }

  const feeAmount =
    exactIn && sqrtRatioNextX96 !== sqrtRatioTargetX96
      ? // Short of the boundary: the rest of the input is the fee.
        amountRemaining - amountIn
      : mulDivRoundingUp(amountIn, fee, MAX_FEE - fee);

  return [sqrtRatioNextX96, amountIn, amountOut, feeAmount];
}
