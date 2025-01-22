import {
  big,
  AnyChain,
  AssetAmount,
  EvmParachain,
} from '@galacticcouncil/xcm-core';

import Big from 'big.js';

/**
 * Calculate maximum allowed amount of asset to send from source to
 * destination chain.
 *
 * @param balance - source chain asset balance
 * @param fee - source chain transfer fee
 * @param min - source chain minimum
 * @param ed - source chain existential deposit (opt)
 * @returns - maximum allowed amount of tokens to send or zero in
 * case of not enough funds
 */
export function calculateMax(
  balance: AssetAmount,
  fee: AssetAmount,
  min: AssetAmount,
  ed?: AssetAmount
): AssetAmount {
  let result = balance
    .toBig()
    .minus(min.toBig())
    .minus(balance.isSame(fee) ? fee.toBig() : new Big(0));

  if (ed) {
    result = result.minus(balance.isSame(ed) ? ed.toBig() : new Big(0));
  }

  return balance.copyWith({
    amount: result.lt(0) ? 0n : BigInt(result.toFixed()),
  });
}

/**
 * Calculate minimum required amount of asset to send from source to
 * destination chain.
 *
 * @param balance - destination chain asset balance
 * @param fee - destination chain transfer fee
 * @param min - destination chain minimum
 * @param ed - destination chain existential deposit (opt)
 * @returns - minimum required amount of tokens to send or zero in
 * case of no available funds
 */
export function calculateMin(
  balance: AssetAmount,
  fee: AssetAmount,
  min: AssetAmount,
  ed?: AssetAmount
): AssetAmount {
  const zero = balance.copyWith({
    amount: 0n,
  });

  let result = zero
    .toBig()
    .plus(balance.isSame(fee) ? fee.toBig() : new Big(0))
    .plus(balance.toBig().lt(min.toBig()) ? min.toBig() : new Big(0));

  if (ed) {
    result = result.plus(
      balance.isSame(ed) && balance.toBig().lt(ed.toBig())
        ? ed.toBig()
        : new Big(0)
    );
  }

  return balance.copyWith({
    amount: BigInt(result.toFixed()),
  });
}

/**
 * Return h160 derivated address in case of Evm parachain
 *
 * @param address - h160 or ss58 address format
 * @param chain - transfer chain ctx
 * @returns - derivated address if evm resolver defined, fallback to default
 */
export async function formatEvmAddress(
  address: string,
  chain: AnyChain
): Promise<string> {
  if (chain.isEvmParachain()) {
    const evmParachain = chain as EvmParachain;
    return evmParachain.getDerivatedAddress(address);
  }
  return address;
}

/**
 * Format amount if defined
 *
 * @param decimals - fee asset decimals
 * @param amount - fee amount
 * @returns formatted amount or 0
 */
export function formatAmount(decimals: number, amount?: number): bigint {
  return amount ? big.toBigInt(amount, decimals) : 0n;
}

/**
 * Multiply amount by fraction
 *
 * @param amount - fee amount
 * @param fraction - fraction
 * @returns percentile amount
 */
export function multiplyByFraction(amount: bigint, fraction: number): bigint {
  const numerator = BigInt(fraction * 10);
  const denominator = BigInt(10);
  return (amount * numerator) / denominator;
}
