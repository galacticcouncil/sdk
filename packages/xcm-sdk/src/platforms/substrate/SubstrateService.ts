import '@galacticcouncil/api-augment/hydradx';

import {
  acc,
  addr,
  multiloc,
  AnyParachain,
  Asset,
  AssetAmount,
  ExtrinsicConfig,
} from '@galacticcouncil/xcm-core';

import { ApiPromise } from '@polkadot/api';
import { SubmittableExtrinsic } from '@polkadot/api/promise/types';
import { CallDryRunEffects } from '@polkadot/types/interfaces';

import { hexToU8a, stringToU8a } from '@polkadot/util';
import { blake2AsHex } from '@polkadot/util-crypto';

import { getDeliveryFeeFromDryRun, getErrorFromDryRun } from './utils';

export class SubstrateService {
  readonly api: ApiPromise;

  readonly chain: AnyParachain;

  constructor(api: ApiPromise, chain: AnyParachain) {
    this.api = api;
    this.chain = chain;
  }

  static async create(chain: AnyParachain): Promise<SubstrateService> {
    return new SubstrateService(await chain.api, chain);
  }

  get asset(): Asset {
    const nativeToken = this.api.registry.chainTokens[0];
    const nativeTokenKey = nativeToken.toLowerCase();
    const asset = this.chain.getAsset(nativeTokenKey);
    if (!asset) {
      throw new Error(`No asset found for key "${nativeTokenKey}"`);
    }
    return asset;
  }

  get decimals(): number {
    return this.api.registry.chainDecimals[0];
  }

  get existentialDeposit(): AssetAmount {
    let ed;
    try {
      ed = this.api.consts.balances.existentialDeposit.toBigInt();
    } catch {
      ed = 0n;
    }
    return AssetAmount.fromAsset(this.asset, {
      amount: ed,
      decimals: this.decimals,
    });
  }

  isDryRunSupported(): boolean {
    return this.api.call.dryRunApi !== undefined;
  }

  getDecimals(asset: Asset): number {
    return this.chain.getAssetDecimals(asset) ?? this.decimals;
  }

  getExtrinsic(config: ExtrinsicConfig): SubmittableExtrinsic {
    const fn = this.api.tx[config.module][config.func];
    const args = config.getArgs(fn);

    if (args.length > 1 && config.func === 'batchAll') {
      const calls = args.map(({ module, func, getArgs }) => {
        const fn = this.api.tx[module][func];
        const args = getArgs(fn);
        return fn(...args);
      });
      return fn(calls);
    }
    return fn(...args);
  }

  async buildMessageId(
    account: string,
    amount: bigint,
    asset: string,
    beneficiary: string
  ): Promise<string> {
    const accountNextId = await this.api.rpc.system.accountNextIndex(account);
    const entropy = new Uint8Array([
      ...stringToU8a(this.chain.parachainId.toString()),
      ...hexToU8a(account),
      ...accountNextId.toU8a(),
      ...hexToU8a(asset),
      ...stringToU8a(beneficiary),
      ...stringToU8a(amount.toString()),
    ]);
    return blake2AsHex(entropy);
  }

  async dryRun(
    account: string,
    config: ExtrinsicConfig
  ): Promise<CallDryRunEffects> {
    const extrinsic = this.getExtrinsic(config);

    const dryRunFn = this.api.call.dryRunApi.dryRunCall;
    const dryRunParams = dryRunFn.meta.params;
    const dryRun = dryRunFn as (...args: any[]) => Promise<any>;
    const dryRunArgs = [
      {
        System: { Signed: account },
      },
      extrinsic.inner.toHex(),
    ] as any;

    if (dryRunParams.length === 3) {
      dryRunArgs.push(4);
    }

    let result;
    try {
      result = await dryRun(...dryRunArgs);
    } catch (e) {
      console.error(e);
      throw new Error('Dry run execution failed!');
    }

    if (result.isOk) {
      return result.asOk;
    }
    console.log(result.asErr.toHuman());
    throw new Error('Dry run execution error!');
  }

  async estimateNetworkFee(
    account: string,
    config: ExtrinsicConfig
  ): Promise<bigint> {
    const extrinsic = this.getExtrinsic(config);
    try {
      const info = await extrinsic.paymentInfo(account, {
        nonce: -1,
      });
      return info.partialFee.toBigInt();
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
      const acc = this.estimateDeliveryFeeWith(account, config);

      try {
        const { executionResult, emittedEvents } = await this.dryRun(
          acc,
          config
        );
        if (executionResult.isOk) {
          return getDeliveryFeeFromDryRun(emittedEvents);
        } else {
          const error = getErrorFromDryRun(this.api, executionResult.asErr);
          console.warn(`Can't estimate delivery fee. Reason:\n ${error}`);
        }
      } catch (e) {}
    }
    return 0n;
  }

  private estimateDeliveryFeeWith(
    account: string,
    config: ExtrinsicConfig
  ): string {
    if (['xcmPallet', 'polkadotXcm'].includes(config.module)) {
      const fn = this.api.tx[config.module][config.func];
      const [dest] = config.getArgs(fn);
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
          ? addr.encodePubKey(saPub.relay, 0)
          : addr.encodePubKey(saPub.generic, 0);
      }

      // Upward (use chain treasury account if any)
      if (interior && interior['interior'] === 'Here') {
        return this.chain.treasury || account;
      }
    }
    return account;
  }
}
