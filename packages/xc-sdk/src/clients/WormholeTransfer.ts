import {
  addr,
  Abi,
  AnyChain,
  AnyEvmChain,
  ConfigService,
  EvmParachain,
  Ntt,
  NttTokenDef,
  Parachain,
  SolanaChain,
  SuiChain,
  Wormhole,
} from '@galacticcouncil/xc-core';

import { big } from '@galacticcouncil/common';

import { keccak256 } from 'viem';

import { encoding } from '@wormhole-foundation/sdk-base';

import { EvmClaim, SolanaClaim, SubstrateClaim, SuiClaim } from '../platforms';

import { Operation, WormholeScan } from './WormholeScan';
import { WhTransfer, WhStatus } from './types';

const { EvmAddr } = addr;

type NttContext = {
  chain: AnyChain;
  assetKey: string;
  def: NttTokenDef;
};

/** Hex addresses match case-insensitive. */
const isSameAddress = (a: string, b: string): boolean =>
  a.toLowerCase() === b.toLowerCase();

/**
 * Wormhole vaa hash, the identity a transceiver marks as consumed.
 *
 * Double keccak of the body alone - the signatures are stripped, so the
 * hash is stable no matter which guardian subset attested.
 */
function getVaaHash(vaaRaw: string): `0x${string}` {
  const vaa = encoding.b64.decode(vaaRaw);
  const signatures = vaa[5];
  const body = vaa.subarray(6 + signatures * 66);
  return keccak256(keccak256(body));
}

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
    const chainId = Wormhole.fromChain(this.parachain)
      .getWormholeId()
      .toString();

    // Scoped by chain, not by `address`: wormholescan matches that filter
    // against the sender it extracted from the source transaction, which is
    // never the receiver and is left empty for parachain emitted operations.
    // Both directions are matched on the addresses the operation carries.
    const [sent, received] = await Promise.all([
      this.whScan.getOperations({ ...this.filters, sourceChain: chainId }),
      this.whScan.getOperations({ ...this.filters, targetChain: chainId }),
    ]);

    const operations = new Map<string, Operation>();
    sent
      .filter((o) =>
        isSameAddress(o.content.standarizedProperties.fromAddress, h160)
      )
      .forEach((o) => operations.set(o.id, o));
    received
      .filter((o) =>
        isSameAddress(o.content.standarizedProperties.toAddress, h160)
      )
      .forEach((o) => operations.set(o.id, o));

    const transfers = await Promise.all(
      Array.from(operations.values()).map((o) => this.toTransfer(o))
    );
    return transfers.filter((t): t is WhTransfer => !!t);
  }

  private async toTransfer(
    operation: Operation
  ): Promise<WhTransfer | undefined> {
    const { content, data, emitterChain, emitterAddress } = operation;
    const { standarizedProperties } = content;

    const source = this.findNttByEmitter(emitterChain, emitterAddress.native);
    if (!source) {
      return undefined;
    }

    const toChain = this.findChainByWormholeId(standarizedProperties.toChain);
    if (!toChain) {
      return undefined;
    }

    let status = this.getStatus(operation);

    let redeem;
    const destination = this.findDestinationNtt(source, toChain);
    if (status === WhStatus.VaaEmitted && operation.vaa && destination) {
      const vaaRaw = operation.vaa.raw;
      if (await this.isRedeemed(toChain, destination, vaaRaw)) {
        status = WhStatus.Completed;
      } else {
        redeem = async (from: string) => {
          if (toChain instanceof SolanaChain) {
            const claim = new SolanaClaim(toChain);
            return claim.redeem(from, vaaRaw, destination);
          }
          if (toChain instanceof SuiChain) {
            const claim = new SuiClaim(toChain);
            return claim.redeem(from, vaaRaw, destination);
          }
          if (!EvmAddr.isValid(from) && toChain instanceof EvmParachain) {
            const claim = await SubstrateClaim.create(toChain);
            return claim.redeem(from, vaaRaw, destination);
          }
          const claim = new EvmClaim();
          return claim.redeem(from, vaaRaw, destination);
        };
      }
    }

    // Only the indexer's enriched `data` carries a formatted amount & symbol,
    // and it stays empty for parachain emitted operations - fall back to the
    // transfer's own properties and the registry key.
    const asset = this.config.assets.get(source.assetKey);

    return {
      asset: standarizedProperties.tokenAddress,
      assetSymbol: data?.symbol ?? asset?.originSymbol ?? source.assetKey,
      amount:
        data?.tokenAmount ??
        big.toDecimal(
          BigInt(standarizedProperties.amount),
          standarizedProperties.normalizedDecimals
        ),
      from: standarizedProperties.fromAddress,
      fromChain: source.chain,
      to: standarizedProperties.toAddress,
      toChain: toChain,
      status: status,
      redeem: redeem,
      operation: operation,
    };
  }

  /**
   * Whether the destination transceiver already consumed the vaa.
   *
   * Wormholescan doesn't observe the redeem on every chain (`targetChain`
   * stays empty for hydration), so a delivered transfer would otherwise
   * keep offering a claim that reverts. Evm destinations only - solana &
   * sui still rely on the indexer.
   */
  private async isRedeemed(
    toChain: AnyChain,
    ntt: NttTokenDef,
    vaaRaw: string
  ): Promise<boolean> {
    if (!toChain.isEvmChain() && !toChain.isEvmParachain()) {
      return false;
    }

    const { evmClient } = toChain as AnyEvmChain;
    const consumed = await evmClient.getProvider().readContract({
      abi: Abi.WormholeTransceiver,
      address: ntt.transceiver.wormhole as `0x${string}`,
      args: [getVaaHash(vaaRaw)],
      functionName: 'isVAAConsumed',
    });
    return consumed as boolean;
  }

  private findChainByWormholeId(wormholeId: number): AnyChain | undefined {
    return this.chains.find(
      (c) =>
        Wormhole.isKnown(c) &&
        Wormhole.fromChain(c).getWormholeId() === wormholeId
    );
  }

  /**
   * NTT deployment of the transferred token on the destination chain.
   *
   * The emitter identifies the token by its key on the **source** chain,
   * which is not necessarily the key it carries on the destination (`dai`
   * on ethereum, `dai_mwh` on hydration). The registered route holds that
   * mapping, so resolve through it when the key doesn't carry over.
   */
  private findDestinationNtt(
    source: NttContext,
    toChain: AnyChain
  ): NttTokenDef | undefined {
    const direct = Ntt.find(toChain, source.assetKey);
    if (direct) {
      return direct;
    }

    const asset = this.config.assets.get(source.assetKey);
    if (!asset) {
      return undefined;
    }

    const routes = this.config.getAssetRoutesOrEmpty(
      asset,
      source.chain,
      toChain
    );
    for (const route of routes) {
      const def = Ntt.find(toChain, route.destination.asset.key);
      if (def) {
        return def;
      }
    }
    return undefined;
  }

  private findNttByEmitter(
    wormholeId: number,
    emitter: string
  ): NttContext | undefined {
    const chain = this.findChainByWormholeId(wormholeId);
    if (!chain) {
      return undefined;
    }

    const entry = Ntt.findByEmitter(chain, emitter);
    if (entry) {
      return { chain, ...entry };
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
