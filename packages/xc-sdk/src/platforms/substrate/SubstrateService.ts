import {
  addr,
  multiloc,
  AnyParachain,
  Asset,
  AssetAmount,
  ChainCurrency,
  Extrinsic,
  ExtrinsicConfig,
} from '@galacticcouncil/xc-core';

import { acc, enums } from '@galacticcouncil/common';
import { HubApis } from '@galacticcouncil/descriptors';

import { Blake2256, u32 } from '@polkadot-api/substrate-bindings';
import { toHex, fromHex } from '@polkadot-api/utils';

import { Enum } from 'polkadot-api';

import { getDeliveryFeeFromDryRun, getErrorFromDryRun } from './utils';

type TRawDryRun = HubApis['DryRunApi']['dry_run_call']['Value']['value'];
type TDryRun = Extract<TRawDryRun, { execution_result: any }>;

const { Ss58Addr } = addr;

export class SubstrateService {
  readonly chain: AnyParachain;

  private _currency?: Promise<ChainCurrency>;

  constructor(chain: AnyParachain) {
    this.chain = chain;
  }

  static async create(chain: AnyParachain): Promise<SubstrateService> {
    return new SubstrateService(chain);
  }

  get client() {
    return this.chain.client;
  }

  get api() {
    return this.client.getUnsafeApi();
  }

  async getCurrency(): Promise<ChainCurrency> {
    if (!this._currency) {
      this._currency = this.chain.getCurrency();
    }
    return this._currency;
  }

  async getAsset(): Promise<Asset> {
    const currency = await this.getCurrency();
    return currency.asset;
  }

  async getDecimals(): Promise<number> {
    const currency = await this.getCurrency();
    return currency.decimals;
  }

  async getExistentialDeposit(): Promise<AssetAmount> {
    let ed: bigint;
    try {
      const result = await this.api.constants.Balances.ExistentialDeposit();
      ed = typeof result === 'bigint' ? result : BigInt(String(result));
    } catch {
      ed = 0n;
    }
    const { asset, decimals } = await this.getCurrency();
    return AssetAmount.fromAsset(asset, {
      amount: ed,
      decimals,
    });
  }

  isDryRunSupported(): boolean {
    return this.api.apis?.DryRunApi !== undefined;
  }

  async buildMessageId(
    account: string,
    amount: bigint,
    asset: string,
    beneficiary: string
  ): Promise<string> {
    const accountNextId = await this.client._request<number>(
      'system_accountNextIndex',
      [account]
    );
    const accountNextIdBytes = u32.enc(accountNextId);

    const stringToU8a = (str: string) => new TextEncoder().encode(str);

    const entropy = new Uint8Array([
      ...stringToU8a(this.chain.parachainId.toString()),
      ...fromHex(account.startsWith('0x') ? account.slice(2) : account),
      ...accountNextIdBytes,
      ...fromHex(asset.startsWith('0x') ? asset.slice(2) : asset),
      ...stringToU8a(beneficiary),
      ...stringToU8a(amount.toString()),
    ]);

    const hash = Blake2256(entropy);
    return toHex(hash);
  }

  async dryRun(account: string, tx: Extrinsic): Promise<TDryRun> {
    const rawOrigin = Enum('Signed', account);
    const origin = Enum('system', rawOrigin);

    const raw = await this.api.apis.DryRunApi.dry_run_call(
      origin,
      tx.decodedCall,
      4
    );

    if (!raw.success) {
      throw new Error('DryRun call failed');
    }

    const result = raw.value as TRawDryRun;
    if ('type' in result && 'value' in result) {
      throw new Error('DryRun call error: ' + enums.enumPath(result.value));
    }

    return result as TDryRun;
  }

  async estimateNetworkFee(
    account: string,
    config: ExtrinsicConfig
  ): Promise<bigint> {
    const tx = config.getTx(this.client);
    try {
      const info = await tx.getPaymentInfo(account);
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
        const tx = config.getTx(this.client);
        const dryRunResult = await this.dryRun(acc, tx);

        if (dryRunResult.execution_result?.success) {
          return getDeliveryFeeFromDryRun(dryRunResult.emitted_events || []);
        } else {
          const error = getErrorFromDryRun(dryRunResult.execution_result);
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
    if (['PolkadotXcm'].includes(config.module)) {
      const extrinsic = config.getTx(this.client).decodedCall;
      const args = extrinsic.value.value;
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
