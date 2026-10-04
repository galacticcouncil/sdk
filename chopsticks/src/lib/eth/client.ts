import { getContractAddress, type Hex } from 'viem';

import type { Fork } from '../network';

import { sendRawEthTxs, type EthBatchResult } from './submit';

const DEFAULT_GAS = 6_000_000n;
const DEFAULT_GAS_PRICE = 10_000_000n; // 0.01 gwei, a realistic hydration gas price

export interface EthClientOpts {
  chainId: number;
  gas?: bigint;
  gasPrice?: bigint;
}

/**
 * Anything that signs a legacy tx - a viem `LocalAccount`.
 *
 * - Typed structurally, so accounts of any viem instance fit
 */
export interface EvmSigner {
  address: Hex;
  signTransaction(tx: {
    type: 'legacy';
    chainId: number;
    nonce: number;
    gasPrice: bigint;
    gas: bigint;
    value: bigint;
    to?: Hex;
    data: Hex;
  }): Promise<Hex>;
}

/**
 * A minimal eth wallet over a chopsticks fork.
 *
 * - Signs legacy txs with a viem account, tracking the nonce locally
 * - Every block on a fork costs the same fixed build time, so txs are signed
 *   first and sealed together with {@link sendBatch}
 */
export class EthClient {
  private nonce = 0;

  constructor(
    private readonly fork: Fork,
    private readonly account: EvmSigner,
    private readonly opts: EthClientOpts
  ) {}

  get address(): Hex {
    return this.account.address;
  }

  /** Sign a deploy (CREATE) at the next nonce - its address is known ahead. */
  async signDeploy(
    initCode: Hex,
    gas?: bigint,
    value = 0n
  ): Promise<{ address: Hex; rawTx: Hex }> {
    const address = getContractAddress({
      from: this.account.address,
      nonce: BigInt(this.nonce),
    });
    return { address, rawTx: await this.sign({ data: initCode, value, gas }) };
  }

  /** Sign a contract call at the next nonce. */
  signCall(to: Hex, data: Hex, gas?: bigint, value = 0n): Promise<Hex> {
    return this.sign({ to, data, value, gas });
  }

  /** Seal signed txs - in nonce order - into one block. */
  sendBatch(rawTxs: Hex[]): Promise<EthBatchResult> {
    return sendRawEthTxs(this.fork, rawTxs);
  }

  private async sign(fields: {
    to?: Hex;
    data: Hex;
    value?: bigint;
    gas?: bigint;
  }): Promise<Hex> {
    const rawTx = await this.account.signTransaction({
      type: 'legacy',
      chainId: this.opts.chainId,
      nonce: this.nonce,
      gasPrice: this.opts.gasPrice ?? DEFAULT_GAS_PRICE,
      gas: fields.gas ?? this.opts.gas ?? DEFAULT_GAS,
      value: fields.value ?? 0n,
      to: fields.to,
      data: fields.data,
    });
    this.nonce += 1;
    return rawTx;
  }
}
