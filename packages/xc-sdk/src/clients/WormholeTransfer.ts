import {
  acc,
  mrl,
  AnyChain,
  ConfigService,
  ChainType,
  EvmChain,
  EvmParachain,
  Parachain,
  Precompile,
  SolanaChain,
  Wormhole,
} from '@galacticcouncil/xc-core';

import { encoding } from '@wormhole-foundation/sdk-base';
import { keccak256 } from '@wormhole-foundation/sdk-connect';
import { deserialize } from '@wormhole-foundation/sdk-definitions';

import { EvmClaim, SolanaClaim, SubstrateClaim } from '../platforms';

import { Operation, WormholeScan } from './WormholeScan';
import { WhTransfer, WhStatus } from './types';

const REDEEM_THRESHOLD = 5 * 60 * 1000; // 5 minutes

export class WormholeTransfer {
  private parachainId: number;
  private config: ConfigService;

  readonly whScan: WormholeScan;

  constructor(config: ConfigService, parachainId: number) {
    this.config = config;
    this.parachainId = parachainId;

    this.whScan = new WormholeScan();
  }

  get chains(): AnyChain[] {
    const configChains = this.config.chains.values();
    return Array.from(configChains);
  }

  get filters(): Record<string, string> {
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(toDate.getDate() - 6);

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
      const { payload, standarizedProperties } = content;

      const status = this.getStatus(o);

      const fromChain = this.chains.find(
        (c) => c instanceof Parachain && c.parachainId === this.parachainId
      )!;

      const { toAddress, tokenAddress } = standarizedProperties;
      const toChain = this.chains.find(
        (c) =>
          Wormhole.isKnown(c) &&
          Wormhole.fromChain(c).getWormholeId() === payload.tokenChain
      )!;

      let redeem;
      if (status === WhStatus.VaaEmitted && o.vaa) {
        const { timestamp } = this.getVaaHeader(o.vaa.raw);
        const vaaRaw = o.vaa.raw;

        if (this.isStuck(timestamp)) {
          switch (toChain.getType()) {
            case ChainType.EvmChain:
              const evmClaim = new EvmClaim(toChain as EvmChain);
              redeem = async (from: string) => evmClaim.redeem(from, vaaRaw);
              break;
            case ChainType.SolanaChain:
              const solanaClaim = new SolanaClaim(toChain as SolanaChain);
              redeem = async (from: string) => solanaClaim.redeem(from, vaaRaw);
              break;
          }
        }
      }

      return {
        asset: tokenAddress,
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

    const toParachain = toChain as Parachain;
    const payload = await mrl.createPayload(toParachain, address);
    const payloadHex = payload.toHex();
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
        const { payload, standarizedProperties } = content;

        const status = this.getStatus(o);
        const { tokenAddress } = standarizedProperties;

        const fromChain = this.chains.find(
          (c) =>
            Wormhole.isKnown(c) &&
            Wormhole.fromChain(c).getWormholeId() === payload.tokenChain
        )!;

        const viaChain = this.chains.find(
          (c) =>
            Wormhole.isKnown(c) &&
            Wormhole.fromChain(c).getWormholeId() === payload.toChain
        )!;

        let redeem;
        if (status === WhStatus.VaaEmitted && o.vaa) {
          const { timestamp } = this.getVaaHeader(o.vaa.raw);
          const vaaRaw = o.vaa.raw;

          if (this.isStuck(timestamp)) {
            const claim = new SubstrateClaim(viaChain as EvmParachain);
            redeem = async (address: string) =>
              claim.redeemMrlViaXcm(address, vaaRaw);
          }
        }

        return {
          asset: tokenAddress,
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

  private getVaaHeader(vaaRaw: string) {
    const vaaBytes = encoding.b64.decode(vaaRaw);
    const vaa = deserialize('Uint8Array', vaaBytes);
    return {
      timestamp: vaa.timestamp,
      emitterChain: vaa.emitterChain,
      emitterAddress: vaa.emitterAddress.toString(),
      sequence: vaa.sequence,
      payload: vaa.payload,
      hash: vaa.hash,
      id: keccak256(vaa.hash),
    };
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
}
