import {
  acc,
  addr,
  multiloc,
  AnyParachain,
  Asset,
  AssetAmount,
  ExtrinsicConfig,
} from '@galacticcouncil/xc-core';

import { Blake2256 } from '@polkadot-api/substrate-bindings';
import { toHex, fromHex } from '@polkadot-api/utils';

import { PolkadotClient, Transaction } from 'polkadot-api';

import {
  getDeliveryFeeFromDryRun,
  getErrorFromDryRun,
} from './utils';

const { Ss58Addr } = addr;

export class SubstrateService {
  readonly client: PolkadotClient;
  readonly api: ReturnType<PolkadotClient['getUnsafeApi']>;
  readonly chain: AnyParachain;
  private _chainSpec?: any; // Cache for chain spec data
  private _asset?: Asset; // Cache for native asset
  private _decimals?: number; // Cache for native decimals

  constructor(client: PolkadotClient, chain: AnyParachain) {
    this.client = client;
    this.api = client.getUnsafeApi();
    this.chain = chain;
  }

  static async create(chain: AnyParachain): Promise<SubstrateService> {
    return new SubstrateService(chain.api, chain);
  }

  private async getChainSpec() {
    if (!this._chainSpec) {
      this._chainSpec = await this.client.getChainSpecData();
    }
    return this._chainSpec;
  }

  async getAsset(): Promise<Asset> {
    if (!this._asset) {
      const chainSpec = await this.getChainSpec();
      const tokenSymbol = chainSpec.properties?.tokenSymbol;
      const nativeToken = Array.isArray(tokenSymbol)
        ? tokenSymbol[0]
        : tokenSymbol;
      const nativeTokenKey = nativeToken.toLowerCase();
      const asset = this.chain.getAsset(nativeTokenKey);
      if (!asset) {
        throw new Error(`No asset found for key "${nativeTokenKey}"`);
      }
      this._asset = asset;
    }
    return this._asset;
  }

  async getDecimals(): Promise<number> {
    if (this._decimals === undefined) {
      const chainSpec = await this.getChainSpec();
      const decimalsArray = chainSpec.properties?.tokenDecimals || [];
      const decimals = decimalsArray[0] || 12;
      this._decimals = decimals;
      return decimals;
    }
    return this._decimals;
  }

  async getExistentialDeposit(): Promise<AssetAmount> {
    let ed: bigint;
    try {
      const result = await this.api.constants.Balances.ExistentialDeposit();
      ed = typeof result === 'bigint' ? result : BigInt(String(result));
    } catch {
      ed = 0n;
    }
    const asset = await this.getAsset();
    const decimals = await this.getDecimals();
    return AssetAmount.fromAsset(asset, {
      amount: ed,
      decimals,
    });
  }

  isDryRunSupported(): boolean {
    return this.api.apis?.DryRunApi !== undefined;
  }

  async getDecimalsForAsset(asset: Asset): Promise<number> {
    const chainDecimals = await this.getDecimals();
    return this.chain.getAssetDecimals(asset) ?? chainDecimals;
  }

  getExtrinsic(config: ExtrinsicConfig): Transaction<any, any, any, any> {
    const txModule = (this.api.tx as any)[config.module];
    if (!txModule) {
      throw new Error(
        `Pallet "${config.module}" not found in runtime`
      );
    }

    const txFunc = txModule[config.func];
    if (!txFunc || typeof txFunc !== 'function') {
      throw new Error(
        `Extrinsic "${config.func}" not found in pallet "${config.module}"`
      );
    }

    const txData = config.getArgs();

    // Handle batch calls with nested ExtrinsicConfigs
    if (this.isBatchCall(config.func)) {
      return this.buildBatchCall(txFunc, txData);
    }

    return txFunc(txData) as Transaction<any, any, any, any>;
  }

  /**
   * Check if extrinsic is a batch call
   */
  private isBatchCall(func: string): boolean {
    return ['batch', 'batch_all', 'force_batch'].includes(func);
  }

  /**
   * Build batch call with recursive ExtrinsicConfig processing
   */
  private buildBatchCall(
    txFunc: Function,
    txData: any
  ): Transaction<any, any, any, any> {
    if (!txData || typeof txData !== 'object') {
      throw new Error('Batch call requires transaction data');
    }

    // Handle array of calls (legacy)
    if (Array.isArray(txData)) {
      const calls = txData.map((item) =>
        item instanceof ExtrinsicConfig ? this.getExtrinsic(item) : item
      );
      return txFunc({ calls }) as Transaction<any, any, any, any>;
    }

    // Handle object with calls property
    if ('calls' in txData && Array.isArray(txData.calls)) {
      const calls = txData.calls.map((item: any) =>
        item instanceof ExtrinsicConfig ? this.getExtrinsic(item) : item
      );
      return txFunc({ ...txData, calls }) as Transaction<any, any, any, any>;
    }

    return txFunc(txData) as Transaction<any, any, any, any>;
  }

  async buildMessageId(
    account: string,
    amount: bigint,
    asset: string,
    beneficiary: string
  ): Promise<string> {
    // Use client._request for RPC calls in PAPI
    const accountNextId = await this.client._request<number>(
      'system_accountNextIndex',
      [account]
    );

    // Convert the number to bytes (u32 little-endian)
    const accountNextIdBytes = new Uint8Array(4);
    new DataView(accountNextIdBytes.buffer).setUint32(0, accountNextId, true);

    // Helper to convert string to UTF-8 bytes
    const stringToU8a = (str: string) => new TextEncoder().encode(str);

    const entropy = new Uint8Array([
      ...stringToU8a(this.chain.parachainId.toString()),
      ...fromHex(account.startsWith('0x') ? account.slice(2) : account),
      ...accountNextIdBytes,
      ...fromHex(asset.startsWith('0x') ? asset.slice(2) : asset),
      ...stringToU8a(beneficiary),
      ...stringToU8a(amount.toString()),
    ]);

    // Use PAPI's Blake2-256 and convert to hex
    const hash = Blake2256(entropy);
    return toHex(hash);
  }

  async dryRun(
    account: string,
    extrinsic: Transaction<any, any, any, any>
  ): Promise<any> {
    if (!this.api.apis?.DryRunApi) {
      throw new Error('DryRunApi not available on this chain');
    }

    const origin = {
      System: { Signed: account },
    };

    const callData = extrinsic.decodedCall;

    // DryRun API returns result wrapped in { success, value }
    // Unwrap to get the actual result containing execution_result, emitted_events, forwarded_xcms
    const result = await this.api.apis.DryRunApi.dry_run_call(origin, callData);
    if (!result.success) {
      throw new Error('DryRun call failed');
    }
    return result.value;
  }

  async estimateNetworkFee(
    account: string,
    config: ExtrinsicConfig
  ): Promise<bigint> {
    const extrinsic = await this.getExtrinsic(config);
    try {
      const info = await extrinsic.getPaymentInfo(account);
      return BigInt(info.partial_fee);
    } catch (e) {
      /**
       * Tx panic for V3 or higher multi-location versions if used
       * for an extrinsic with empty ammount (of transferred asset).
       */
      console.warn(`Can't estimate network fee.`);
    }
    return 0n;
  }

  async estimateDeliveryFee(
    account: string,
    config: ExtrinsicConfig
  ): Promise<bigint> {
    if (this.chain.usesDeliveryFee) {
      const acc = await this.estimateDeliveryFeeWith(account, config);

      try {
        const extrinsic = this.getExtrinsic(config);
        const dryRunResult = await this.dryRun(acc, extrinsic);

        if (dryRunResult.execution_result?.success) {
          return getDeliveryFeeFromDryRun(dryRunResult.emitted_events || []);
        } else {
          const error = getErrorFromDryRun(
            dryRunResult.execution_result?.value
          );
          console.warn(`Can't estimate delivery fee. Reason:\n ${error}`);
        }
      } catch (e) {}
    }
    return 0n;
  }

  private async estimateDeliveryFeeWith(
    account: string,
    config: ExtrinsicConfig
  ): Promise<string> {
    if (['XcmPallet', 'PolkadotXcm'].includes(config.module)) {
      const args = config.getArgs();
      if (!args || typeof args !== 'object') return account;

      const dest = 'dest' in args ? args.dest : undefined;
      if (!dest) return account;

      const interior = multiloc.findNestedKey(dest, 'interior');
      const parachain = multiloc.findParachain(dest);
      const consensus = multiloc.findGlobalConsensus(dest);

      // Cross consensus (use user account)
      if (consensus) {
        return account;
      }

      // Downward (use chain sovereign account)
      if (parachain) {
        const saPub = acc.getSovereignAccounts(parachain);
        return this.chain.parachainId === 0
          ? Ss58Addr.encodePubKey(saPub.relay)
          : Ss58Addr.encodePubKey(saPub.generic);
      }

      // Upward (use chain treasury account if any)
      if (interior && interior['interior'] === 'Here') {
        return this.chain.treasury || account;
      }
    }
    return account;
  }
}
