import { big } from '@galacticcouncil/xcm-core';
import { Transfer } from '@galacticcouncil/xcm-sdk';

const isSufficientAssetTransfer = (transfer: Transfer): boolean => {
  return transfer.source.balance.isSame(transfer.source.destinationFee);
};

export const getSourceBalanceDiff = (before: Transfer, after: Transfer) => {
  const balance = before.source.balance;
  const balanceAfter = after.source.balance;

  const delta = balance.amount - balanceAfter.amount;
  const deltaFmt = big.toDecimal(delta, balance.decimals);

  return {
    asset: balance.originSymbol,
    delta: '-' + deltaFmt,
    deltaBn: delta,
  };
};

export const getDestinationBalanceDiff = (
  before: Transfer,
  after: Transfer
) => {
  const balance = before.destination.balance;
  const balanceAfter = after.destination.balance;

  const delta = balanceAfter.amount - balance.amount;
  const deltaFmt = big.toDecimal(delta, balance.decimals);

  return {
    asset: balance.originSymbol,
    delta: '+' + deltaFmt,
    deltaBn: delta,
  };
};

export const getDestinationFee = (
  amount: string,
  before: Transfer,
  after: Transfer
) => {
  const isSufficient = isSufficientAssetTransfer(before);

  if (isSufficient) {
    const balance = before.destination.balance;
    const balanceAfter = after.destination.balance;

    const transfered = big.toBigInt(amount, balance.decimals);

    /*     console.log(transfered, balanceAfter.amount - balance.amount);
     */
    const delta = transfered - (balanceAfter.amount - balance.amount);
    const deltaFmt = big.toDecimal(delta, balance.decimals, balance.decimals);

    /*     console.log(delta, deltaFmt);
     */
    return {
      asset: balance.originSymbol,
      delta: deltaFmt,
      deltaBn: delta,
    };
  }

  const balance = before.source.destinationFeeBalance;
  const balanceAfter = after.source.destinationFeeBalance;

  const delta = balance.amount - balanceAfter.amount;
  const deltaFmt = big.toDecimal(delta, balance.decimals, balance.decimals);

  return {
    asset: balance.originSymbol,
    delta: deltaFmt,
    deltaBn: delta,
  };
};
