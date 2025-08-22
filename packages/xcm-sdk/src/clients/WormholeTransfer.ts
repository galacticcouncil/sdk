import {
  acc,
  mrl,
  AnyChain,
  ConfigService,
  Parachain,
  Wormhole,
  Precompile,
} from '@galacticcouncil/xcm-core';

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
    fromDate.setDate(toDate.getDate() - 3);

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
      ...this.filters,
      address: mda,
    });

    const result = operations.map(async (o) => {
      const { content } = o;
      const { payload } = content;
      const { payloadType, parsedPayload } = payload;

      const asset = this.getTokenAddress(payload);
      const toAddress =
        payloadType === 3
          ? this.toNative(parsedPayload.targetRecipient)
          : this.toNative(payload.toAddress);
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

  async getDeposits(address: string, to = 'hydration'): Promise<WhTransfer[]> {
    const operations = await this.whScan.getOperations({
      ...this.filters,
      address: Precompile.Bridge,
      pageSize: '100',
    });

    const toChain = this.config.chains.get(to);
    if (!toChain) {
      return [];
    }

    const payloadHex = mrl.createPayload(toChain as Parachain, address).toHex();
    const result = operations
      .filter((o) => {
        const { content } = o;
        const { payload } = content;
        return (
          payload.payloadType === 3 &&
          payload.toChain === 16 &&
          '0x' + payload.payload === payloadHex
        );
      })
      .map(async (o) => {
        const { content, sourceChain } = o;
        const { payload } = content;

        const asset = this.getTokenAddress(payload);
        const status = this.getStatus(o);

        const fromChain = this.chains.find(
          (c) =>
            Wormhole.isKnown(c) &&
            Wormhole.fromChain(c).getWormholeId() === payload.tokenChain
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
          from: sourceChain.from,
          fromChain: fromChain,
          to: address,
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

  private toNative(wormholeAddress: string) {
    return '0x' + wormholeAddress.substring(26);
  }
}
