import { Trade, TradeOrder, TradeOrderType, TradeType } from '../types';

export class TradeValidator {
  static ensureType(trade: Trade, expected: TradeType): void {
    if (trade.type !== expected) {
      throw new Error(`Trade must be of type ${expected}, got ${trade.type}`);
    }
  }

  static ensureOrderType(order: TradeOrder, expected: TradeOrderType): void {
    if (order.type !== expected) {
      throw new Error(
        `TradeOrder must be of type ${expected}, got ${order.type}`
      );
    }
  }

  static ensureWithdrawFirst(trade: Trade): void {
    const [firstSwap] = trade.swaps;
    if (!firstSwap.isWithdraw()) {
      throw new Error('First swap must be a aave withdraw');
    }
  }
}
