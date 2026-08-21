import {
  type Abi as TAbi,
  decodeAbiParameters,
  encodeFunctionData,
} from 'viem';

import { Abi } from './abi';
import { Erc20Client } from './Erc20Client';
import { EvmClient } from './EvmClient';
import { Precompile } from './precompile';

// Type-only: `config` reaches back into `evm` through the chain definitions,
// and a value import would close that cycle at runtime.
import type { ContractConfig } from '../config';

/** Conservative gas ceilings, unused gas is refunded by the evm runner. */
export const Gas = {
  approve: 200_000n,
  deposit: 200_000n,
  transfer: 1_200_000n,
  redeem: 2_000_000n,
  queued: 600_000n,
} as const;

/**
 * Evm gas ceilings for the steps a fee estimate can't measure - the transfer
 * reverts while a prerequisite is still pending, and the prerequisites don't
 * exist on chain yet. Realistic upper bounds (weth deposit ~28k, erc20
 * approve ~46k, ntt transfer ~300k), unlike the fatter {@link Gas} ceilings
 * an EVM.call has to declare upfront. Overstating only shrinks the sendable
 * max, gas being metered on chain.
 */
export const FeeGas = {
  deposit: 60_000n,
  approve: 70_000n,
  transfer: 500_000n,
} as const;

export type EvmCallData = {
  to: string;
  data: string;
  value?: bigint;
  gas: bigint;
};

/** Prerequisite step, signed standalone (evm) or batched (substrate). */
export type EvmPrerequisite = EvmCallData & {
  abi: TAbi;
  /** Gas to charge for in a fee estimate, {@link EvmCallData.gas} being the EVM.call ceiling. */
  feeGas: bigint;
  allowance?: bigint;
};

/** WETH.deposit() calldata, wraps the attached native value. */
const WETH_DEPOSIT = encodeFunctionData({
  abi: Abi.Weth,
  functionName: 'deposit',
});

export function isSnowbridgeV2(config: ContractConfig): boolean {
  return config.module === 'Snowbridge' && config.func === 'v2_sendMessage';
}

/**
 * Extract the ERC20 token address from Snowbridge V2 assets arg.
 */
export function getSnowbridgeV2TokenAddress(
  config: ContractConfig
): string | undefined {
  if (!isSnowbridgeV2(config)) return undefined;
  const assets = config.args[1] as string[];
  if (!assets || assets.length === 0) return undefined;
  const [_kind, tokenAddress] = decodeAbiParameters(
    [{ type: 'uint8' }, { type: 'address' }, { type: 'uint128' }],
    assets[0] as `0x${string}`
  );
  return tokenAddress as string;
}

export function isNativeEthBridge(config: ContractConfig): boolean {
  const isSnowbridgeNative =
    config.module === 'Snowbridge' &&
    config.func === 'v2_sendMessage' &&
    Array.isArray(config.args[1]) &&
    config.args[1].length === 0;

  // Snowbridge V1 (legacy) native ETH: sendToken with the zero token address.
  const isSnowbridgeV1Native =
    config.module === 'Snowbridge' &&
    config.func === 'sendToken' &&
    config.args[0] === '0x0000000000000000000000000000000000000000';

  return isSnowbridgeNative || isSnowbridgeV1Native;
}

export function isPrecompile(config: ContractConfig): boolean {
  const precompiles = Object.entries(Precompile).map(([_, v]) => v);
  return precompiles.includes(config.address);
}

/**
 * Account dependent steps required before the call can execute.
 *
 * Ordered - a native gas source is wrapped into the erc20 the contract
 * pulls, which the contract is then approved to spend. Each drops off once
 * executed, so re-deriving after a signed step yields a shorter sequence.
 *
 * A precompile or a bridge taking native eth pulls no erc20 and needs
 * nothing.
 */
export async function getEvmPrerequisites(
  client: EvmClient,
  owner: string,
  amount: bigint,
  config: ContractConfig
): Promise<EvmPrerequisite[]> {
  if (isPrecompile(config) || isNativeEthBridge(config)) {
    return [];
  }

  const tokenAddress =
    config.token ??
    (isSnowbridgeV2(config)
      ? getSnowbridgeV2TokenAddress(config)!
      : (config.args[0] as string));

  const erc20 = new Erc20Client(client, tokenAddress);
  const [wrapped, allowance] = await Promise.all([
    config.wrapNative ? erc20.balanceOf(owner) : 0n,
    erc20.allowance(owner, config.address),
  ]);

  const prerequisites: EvmPrerequisite[] = [];

  if (config.wrapNative && wrapped < amount) {
    prerequisites.push({
      abi: Abi.Weth,
      to: tokenAddress,
      data: WETH_DEPOSIT,
      value: amount - wrapped,
      gas: Gas.deposit,
      feeGas: FeeGas.deposit,
    });
  }

  if (allowance < amount) {
    prerequisites.push({
      abi: Abi.Erc20,
      allowance: allowance,
      to: tokenAddress,
      data: erc20.approve(config.address, amount),
      gas: Gas.approve,
      feeGas: FeeGas.approve,
    });
  }

  return prerequisites;
}
