import {
  acc,
  addr,
  multiloc,
  AnyChain,
  ConfigService,
  Parachain,
  Wormhole,
} from '@galacticcouncil/xcm-core';

import { TypeRegistry } from '@polkadot/types';
import { XcmVersionedLocation } from '@polkadot/types/lookup';

import { WormholeClient } from './WormholeClient';
import { Operation, OperationPayload, WormholeScan } from './WormholeScan';

import { WhTransfer, WhStatus } from './types';

const REDEEM_THRESHOLD = 5 * 60 * 1000; // 5 minutes

export class WormholeTransfer {
  private parachainId: number;
  private config: ConfigService;

  readonly whScan: WormholeScan;
  readonly whClient: WormholeClient;

  constructor(config: ConfigService, parachainId: number) {
    this.config = config;
    this.parachainId = parachainId;

    this.whScan = new WormholeScan();
    this.whClient = new WormholeClient();
  }

  get chains(): AnyChain[] {
    const configChains = this.config.chains.values();
    return Array.from(configChains);
  }

  get filters(): Record<string, string> {
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(toDate.getDate() - 7);

    const toISO = toDate.toISOString();
    const fromISO = fromDate.toISOString();

    return {
      page: '0',
      pageSize: '50',
      includeEndDate: 'true',
      from: fromISO,
      to: toISO,
    };
  }

  async getWithdraws(address: string): Promise<WhTransfer[]> {
    const mda = acc.getMultilocationDerivatedAccount(
      this.parachainId,
      address,
      1,
      true
    );

    const operations = await this.whScan.getOperations({
      address: mda,
      ...this.filters,
    });

    const result = operations.map(async (o) => {
      const { content } = o;
      const { payload } = content;
      const { parsedPayload } = payload;

      const asset = this.getTokenAddress(payload);
      const toAddress = this.toNative(parsedPayload.targetRecipient);
      const status = this.getStatus(o);

      const fromChain = this.chains.find(
        (c) => c instanceof Parachain && c.parachainId === this.parachainId
      )!;

      const toChain = this.chains.find(
        (c) =>
          Wormhole.isKnown(c) &&
          Wormhole.fromChain(c).getWormholeId() === payload.tokenChain
      )!;

      let redeem;
      if (status === WhStatus.VaaEmitted && o.vaa) {
        const { timestamp } = this.whClient.getVaaHeader(o.vaa.raw);
        const vaaRaw = o.vaa.raw;

        if (this.isStuck(timestamp)) {
          redeem = (from: string) =>
            this.whClient.redeem(toChain, from, vaaRaw);
        }
      }

      return {
        asset: asset,
        assetSymbol: o.data.symbol,
        amount: o.data.tokenAmount,
        from: address,
        fromChain: fromChain,
        to: toAddress,
        toChain: toChain,
        status: status,
        redeem: redeem,
        operation: o,
      };
    });

    return Promise.all(result);
  }

  async getDeposits(address: string): Promise<WhTransfer[]> {
    const operations = await this.whScan.getOperations({
      address: address,
      ...this.filters,
    });

    const result = operations
      .filter((o) => {
        const { content } = o;
        return this.whScan.isMrlTransfer(content.payload);
      })
      .map(async (o) => {
        const { content } = o;
        const { payload } = content;

        const decodedPayload = this.decodeMrlPayload(payload.payload).toJSON();
        const parachain = this.parseMultilocation('parachain', decodedPayload);
        const accountId32 = this.parseMultilocation(
          'accountId32',
          decodedPayload
        );
        const account = accountId32['id'];

        const asset = this.getTokenAddress(payload);
        const toAddress = addr.encodePubKey(account, 0);
        const status = this.getStatus(o);

        const fromChain = this.chains.find(
          (c) =>
            Wormhole.isKnown(c) &&
            Wormhole.fromChain(c).getWormholeId() === payload.tokenChain
        )!;

        const toChain = this.chains.find(
          (c) => c instanceof Parachain && c.parachainId === parachain
        )!;

        let redeem;
        if (status === WhStatus.VaaEmitted && o.vaa) {
          const { timestamp } = this.whClient.getVaaHeader(o.vaa.raw);
          const vaaRaw = o.vaa.raw;

          if (this.isStuck(timestamp)) {
            redeem = (address: string) => {
              return this.whClient.redeemMrl(address, vaaRaw);
            };
          }
        }

        return {
          asset: asset,
          assetSymbol: o.data.symbol,
          amount: o.data.tokenAmount,
          from: address,
          fromChain: fromChain,
          to: toAddress,
          toChain: toChain,
          status: status,
          redeem: redeem,
          operation: o,
        };
      });

    return Promise.all(result);
  }

  private isStuck(emittedAt: number) {
    const now = Date.now();
    return now >= emittedAt * 1000 + REDEEM_THRESHOLD;
  }

  private getStatus(operation: Operation) {
    if (operation.vaa) {
      const isCompleted =
        operation.targetChain && operation.targetChain.status === 'completed';
      return isCompleted ? WhStatus.Completed : WhStatus.VaaEmitted;
    } else {
      return WhStatus.WaitingForVaa;
    }
  }

  private getTokenAddress(payload: OperationPayload) {
    const { tokenAddress } = payload;
    if (tokenAddress.startsWith('0x')) {
      return this.toNative(tokenAddress);
    }
    return tokenAddress;
  }

  /**
   * Decode MRL payload
   *
   * @param payload - transfer payload
   * @returns xcm versioned multilocation
   */
  private decodeMrlPayload(payload: string): XcmVersionedLocation {
    const registry = new TypeRegistry();
    return registry.createType(
      'VersionedMultiLocation',
      '0x' + payload.substring(2)
    ) as unknown as XcmVersionedLocation;
  }

  /**
   * Parse multilocation JSON
   *
   * @param key - attr key
   * @param multilocation - multilocation JSON
   * @returns parsed arg if exist, otherwise undefined
   */
  private parseMultilocation(key: string, multilocation?: any) {
    if (location) {
      const entry = multiloc.findNestedKey(multilocation, key);
      return entry && entry[key];
    } else {
      return undefined;
    }
  }

  private toNative(wormholeAddress: string) {
    return '0x' + wormholeAddress.substring(26);
  }
}
