/**
 * Declarative balance storage type for an asset on a chain. A chain registers a
 * `BalanceType` per asset; the chain's balance client knows how to read it.
 */
export enum BalanceType {
  // substrate
  System = 'System',
  Tokens = 'Tokens',
  OrmlTokens = 'OrmlTokens',
  Assets = 'Assets',
  ForeignAssets = 'ForeignAssets',
  // evm
  EvmNative = 'EvmNative',
  EvmErc20 = 'EvmErc20',
  // solana
  SolanaNative = 'SolanaNative',
  SolanaToken = 'SolanaToken',
  // sui
  SuiNative = 'SuiNative',
}

/**
 * Declarative dynamic-minimum storage type. Substrate-only — optional per
 * chain; chains with static minimums rely on `assetsData[*].min` instead.
 */
export enum MinType {
  Assets = 'Assets',
}

const EVM_TYPES = new Set<BalanceType>([
  BalanceType.EvmNative,
  BalanceType.EvmErc20,
]);

export function isEvmBalanceType(type: BalanceType): boolean {
  return EVM_TYPES.has(type);
}
