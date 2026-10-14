import { clients, getNearTransferMsg } from '@galacticcouncil/xc-cfg';
import { Ntt, type TransferValidationReport } from '@galacticcouncil/xc-core';
import {
  ZEC_LOGICAL_ACTIONS,
  ZEC_MARGINAL_FEE,
  formatZec,
  toZecCall,
  type TransferSourceData,
} from '@galacticcouncil/xc-sdk';
import { big } from '@galacticcouncil/common';

import type { ZcashCtx, ZcashTransfer, ZcashTransferArgs } from './types';

const RE_AMOUNT = /^\d+$/;

/**
 * Zcash to Hydration ZEC: a payment to an Omni deposit address, minted into
 * the NEAR manager, which locks and publishes to Hydration.
 *
 * - Fee is the ZIP-317 estimate; the wallet charges the exact one
 * - Checks the Omni minimum and the NEAR → Hydration ntt limits up front:
 *   a refused deposit is lost or refunded by hand only
 * - Building the calls orders the address from Omni, checked against the
 *   connector's own derivation
 *
 * @param ctx - wallet and Omni client
 * @param args - Zcash sender, refunded on a failed mint, and Hydration recipient
 */
export async function buildDeposit(
  ctx: ZcashCtx,
  { srcAddress, dstAddress }: ZcashTransferArgs
): Promise<ZcashTransfer> {
  const { wallet, omni } = ctx;
  const zcash = wallet.config.getChain('zec');
  const near = wallet.config.getChain('near');
  const hydration = wallet.config.getChain('hydration');
  const zec = wallet.config.getAsset('zec');
  const connector = omni.getConnector('zcash');

  const [balance, dstBalance] = await Promise.all([
    zcash.getBalance(zec, srcAddress),
    hydration.getBalance(zec, dstAddress),
  ]);

  const fee = balance.copyWith({
    amount: ZEC_LOGICAL_ACTIONS * ZEC_MARGINAL_FEE,
  });
  const spendable = balance.amount - fee.amount;

  const omniReports = async (
    amount: bigint
  ): Promise<TransferValidationReport[]> => {
    const min = await omni
      .getConnectorConfig('zcash')
      .then(({ min_deposit_amount }) =>
        typeof min_deposit_amount === 'string' &&
        RE_AMOUNT.test(min_deposit_amount)
          ? BigInt(min_deposit_amount)
          : undefined
      )
      .catch(() => undefined);

    if (min === undefined) {
      return [{ chain: zcash.name, error: 'omni.connectorUnreachable' }];
    }
    // Without an amount the amount-bound checks see zero and pass.
    if (amount > 0n && amount < min) {
      return [
        {
          amount: balance.copyWith({ amount: min }).toDecimal(),
          asset: zec.originSymbol,
          chain: zcash.name,
          decimals: balance.decimals,
          min: min,
          error: 'omni.belowMinDeposit',
        },
      ];
    }
    return [];
  };

  const nttReports = async (
    amount: bigint
  ): Promise<TransferValidationReport[]> => {
    const hubDecimals = near.getAssetDecimals(zec) ?? balance.decimals;
    const minted = big.convertDecimals(amount, balance.decimals, hubDecimals);
    const delivered = big.convertDecimals(
      minted,
      hubDecimals,
      dstBalance.decimals
    );

    const [outbound, inbound] = await Promise.all([
      clients
        .nttClient(near, zec)
        .getOutboundLimit()
        .catch(() => undefined),
      clients
        .nttClient(hydration, dstBalance)
        .getInboundLimit(near)
        .catch(() => undefined),
    ]);

    const reports: TransferValidationReport[] = [];
    if (!outbound) {
      reports.push({
        asset: zec.originSymbol,
        chain: near.name,
        error: 'ntt.limitUnreachable',
      });
    } else if (outbound.windowMs > 0 && minted > outbound.capacity) {
      reports.push({
        asset: zec.originSymbol,
        chain: near.name,
        decimals: hubDecimals,
        headroom: outbound.capacity,
        limit: outbound.limit,
        windowMs: outbound.windowMs,
        error: 'ntt.outboundLimitExceeded',
      });
    }
    if (!inbound) {
      reports.push({
        asset: dstBalance.originSymbol,
        chain: hydration.name,
        error: 'ntt.limitUnreachable',
      });
    } else if (inbound.windowMs > 0 && delivered > inbound.capacity) {
      reports.push({
        asset: dstBalance.originSymbol,
        chain: hydration.name,
        decimals: dstBalance.decimals,
        headroom: inbound.capacity,
        limit: inbound.limit,
        windowMs: inbound.windowMs,
        error: 'ntt.inboundLimitExceeded',
      });
    }
    return reports;
  };

  const zero = balance.copyWith({ amount: 0n });

  const transfer: ZcashTransfer = {
    // No fee swaps: a Zcash payment pays its fee in ZEC
    source: {
      balance: balance,
      destinationFee: zero,
      destinationFeeBalance: balance,
      fee: fee,
      feeBalance: balance,
      max: balance.copyWith({ amount: spendable > 0n ? spendable : 0n }),
      min: balance.copyWith({ amount: connector.minDeposit }),
    } as TransferSourceData,
    destination: {
      balance: dstBalance,
      fee: dstBalance.copyWith({ amount: 0n }),
    },
    reversible: true,
    async buildCall(amount) {
      const [call] = await transfer.buildCalls(amount);
      return call;
    },
    async buildCalls(amount) {
      const target = big.toBigInt(amount, balance.decimals);
      if (target < connector.minDeposit) {
        throw new Error(
          `Deposit of ${formatZec(target)} ZEC is below the ` +
            `${formatZec(connector.minDeposit)} ZEC minimum`
        );
      }
      if (!zcash.isValidAddress(srcAddress)) {
        throw new Error('Omni refunds to a Zcash address only: ' + srcAddress);
      }

      const ntt = Ntt.fromChain(near, zec);
      if (ntt.token !== connector.token) {
        throw new Error(
          `Omni mints zcash as ${connector.token}, not the ${ntt.token} ` +
            `${ntt.manager} locks`
        );
      }

      const msg = await getNearTransferMsg(hydration, dstAddress);
      const to = await omni.getDepositAddress({
        chain: 'zcash',
        recipient: ntt.manager,
        msg,
        refundAddress: srcAddress,
      });
      return [toZecCall(srcAddress, to, target)];
    },
    async estimateFee() {
      return fee;
    },
    async estimateDestinationFee() {
      return transfer.destination.fee;
    },
    async validate(feeAmount, amount) {
      const target =
        amount === undefined ? 0n : big.toBigInt(amount, balance.decimals);
      const paid = fee.copyWith({ amount: feeAmount || fee.amount });

      const reports: TransferValidationReport[] = [];
      if (balance.amount < paid.amount) {
        reports.push({
          amount: paid.toDecimal(),
          asset: paid.symbol,
          chain: zcash.name,
          error: 'fee.insufficientBalance',
        });
      }

      const checks = await Promise.all([
        omniReports(target),
        nttReports(target),
      ]);
      return [...reports, ...checks.flat()];
    },
  };

  return transfer;
}
