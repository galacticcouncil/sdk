/** Substrate balance pallets. Owned by {@link Parachain}. */
export enum SubstrateBalanceType {
  System = 'System',
  Tokens = 'Tokens',
  OrmlTokens = 'OrmlTokens',
  Assets = 'Assets',
  ForeignAssets = 'ForeignAssets',
}

/** Evm balance storages. Owned by {@link EvmChain} / {@link EvmParachain}. */
export enum EvmBalanceType {
  Native = 'EvmNative',
  Erc20 = 'EvmErc20',
}

/** Solana balance storages. Owned by {@link SolanaChain}. */
export enum SolanaBalanceType {
  Native = 'SolanaNative',
  Token = 'SolanaToken',
}

/** Sui balance storages. Owned by {@link SuiChain}. */
export enum SuiBalanceType {
  Native = 'SuiNative',
}

/** Any platform's balance storage type. */
export type BalanceType =
  | SubstrateBalanceType
  | EvmBalanceType
  | SolanaBalanceType
  | SuiBalanceType;

/**
 * Declarative dynamic-minimum storage type. Substrate-only — optional per
 * chain; chains with static minimums rely on `assetsData[*].min` instead.
 */
export enum SubstrateMinType {
  Assets = 'Assets',
}

const EVM_TYPES = new Set<BalanceType>(Object.values(EvmBalanceType));

export function isEvmBalanceType(type: BalanceType): type is EvmBalanceType {
  return EVM_TYPES.has(type);
}
