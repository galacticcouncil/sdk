import {
  AnyChain,
  ConfigService,
  EvmParachain,
  NttDef,
  NttTokenDef,
  Parachain,
  Wormhole,
} from '@galacticcouncil/xc-core';

import { EvmClaim } from '../platforms';

import { Operation, WormholeScan } from './WormholeScan';
import { WhTransfer, WhStatus } from './types';

type NttContext = {
  chain: AnyChain;
  assetKey: string;
  def: NttTokenDef;
};

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

  private get parachain(): EvmParachain {
    const chain = this.chains.find(
      (c) => c instanceof Parachain && c.parachainId === this.parachainId
    );
    return chain as EvmParachain;
  }

  /**
   * Get NTT transfers sent from parachain (via wormhole).
   *
   * @param address - parachain user address (ss58 or H160)
   * @returns pending & completed wormhole withdrawals
   */
  async getWithdraws(address: string): Promise<WhTransfer[]> {
    const chainWh = Wormhole.fromChain(this.parachain);
    const transfers = await this.getTransfers(address);
    return transfers.filter(
      (t) => t.operation.emitterChain === chainWh.getWormholeId()
    );
  }

  /**
   * Get NTT transfers received on parachain (via wormhole).
   *
   * @param address - parachain user address (ss58 or H160)
   * @returns pending & completed wormhole deposits
   */
  async getDeposits(address: string): Promise<WhTransfer[]> {
    const chainWh = Wormhole.fromChain(this.parachain);
    const transfers = await this.getTransfers(address);
    return transfers.filter(
      (t) =>
        t.operation.content.standarizedProperties.toChain ===
        chainWh.getWormholeId()
    );
  }

  /**
   * Get all NTT transfers of given user.
   *
   * Transfers are matched against the NTT token registry by the VAA
   * emitter (source transceiver) address.
   *
   * @param address - parachain user address (ss58 or H160)
   * @returns pending & completed wormhole transfers
   */
  async getTransfers(address: string): Promise<WhTransfer[]> {
    const h160 = await this.parachain.getDerivatedAddress(address);

    const operations = await this.whScan.getOperations({
      ...this.filters,
      address: h160,
    });

    return operations
      .map((o) => this.toTransfer(o))
      .filter((t): t is WhTransfer => !!t);
  }

  private toTransfer(operation: Operation): WhTransfer | undefined {
    const { content, emitterChain, emitterAddress, sourceChain } = operation;
    const { standarizedProperties } = content;

    const source = this.findNttByEmitter(emitterChain, emitterAddress.native);
    if (!source) {
      return undefined;
    }

    const toChain = this.findChainByWormholeId(standarizedProperties.toChain);
    if (!toChain) {
      return undefined;
    }

    const status = this.getStatus(operation);

    let redeem;
    const destination = this.findNtt(toChain, source.assetKey);
    if (status === WhStatus.VaaEmitted && operation.vaa && destination) {
      const vaaRaw = operation.vaa.raw;
      const claim = new EvmClaim();
      redeem = async (from: string) => claim.redeem(from, vaaRaw, destination);
    }

    return {
      asset: standarizedProperties.tokenAddress,
      assetSymbol: operation.data.symbol,
      amount: operation.data.tokenAmount,
      from: sourceChain.from,
      fromChain: source.chain,
      to: standarizedProperties.toAddress,
      toChain: toChain,
      status: status,
      redeem: redeem,
      operation: operation,
    };
  }

  private findChainByWormholeId(wormholeId: number): AnyChain | undefined {
    return this.chains.find(
      (c) =>
        Wormhole.isKnown(c) &&
        Wormhole.fromChain(c).getWormholeId() === wormholeId
    );
  }

  private findNtt(chain: AnyChain, assetKey: string): NttTokenDef | undefined {
    if ('ntt' in chain && !!chain['ntt']) {
      return (chain.ntt as NttDef)[assetKey];
    }
    return undefined;
  }

  private findNttByEmitter(
    wormholeId: number,
    emitter: string
  ): NttContext | undefined {
    const chain = this.findChainByWormholeId(wormholeId);
    if (!chain || !('ntt' in chain) || !chain['ntt']) {
      return undefined;
    }

    const registry = chain.ntt as NttDef;
    const entry = Object.entries(registry).find(
      ([_, def]) =>
        def.transceiver.wormhole.toLowerCase() === emitter.toLowerCase()
    );

    if (entry) {
      const [assetKey, def] = entry;
      return { chain, assetKey, def };
    }
    return undefined;
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
