import { tags } from '@galacticcouncil/xc-cfg';
import { Abi, AssetRoute, EvmParachain } from '@galacticcouncil/xc-core';

import { config } from '../setup';

const { Tag } = tags;

/**
 * Hydration (paraId 2034) sibling sovereign account on Moonbeam, in H160 form.
 *
 * `"sibl"` (0x7369626c) + paraId 2034 (0xf207, u32 LE) padded to 20 bytes. This
 * is the account that owns the bridged ERC20s and executes the remote Transact
 * when Hydration governance sends an XCM with `origin_kind: SovereignAccount`.
 */
export const HYDRATION_SA = '0x7369626cf2070000000000000000000000000000';

export const moonbeam = config.getChain('moonbeam') as EvmParachain;

const H160_RX = /^0x[0-9a-fA-F]{40}$/;

export interface MoxitAsset {
  key: string;
  symbol: string;
  /** ERC20 contract on Moonbeam. */
  address: `0x${string}`;
  decimals: number;
  /** Origin chain the token exits to via the Wormhole token bridge. */
  originKey: string;
  originName: string;
  /** The MRL route whose transact (approve + transferTokens) we reuse. */
  route: AssetRoute;
}

export interface MoxitBalance extends MoxitAsset {
  balance: bigint;
  error?: string;
}

/**
 * Valid exit assets, derived from the existing MRL-tagged Hydration routes.
 * Each such route bridges a Moonbeam-held wrapped ERC20 back to its origin
 * chain and already carries the Moonbeam-side transact (approve +
 * `TokenBridge.transferTokens`). We reuse those pairs verbatim.
 */
export function listMoxitAssets(): MoxitAsset[] {
  const routes = config
    .getChainRoutes('hydration')
    .getRoutes()
    .filter((r) => r.tags?.includes(Tag.Mrl) && r.transact);

  const seen = new Set<string>();
  const out: MoxitAsset[] = [];

  for (const route of routes) {
    const asset = route.source.asset;
    if (seen.has(asset.key)) continue;

    const id = moonbeam.getAssetId(asset);
    if (typeof id !== 'string' || !H160_RX.test(id)) continue;

    seen.add(asset.key);
    out.push({
      key: asset.key,
      symbol: asset.originSymbol,
      address: id as `0x${string}`,
      decimals: moonbeam.getAssetDecimals(asset) ?? 18,
      originKey: route.destination.chain.key,
      originName: route.destination.chain.name,
      route,
    });
  }

  return out.sort((a, b) => a.symbol.localeCompare(b.symbol));
}

/** Read the sovereign account balance of every exit asset in parallel. */
export async function fetchSaBalances(
  assets: MoxitAsset[],
  account: string = HYDRATION_SA
): Promise<MoxitBalance[]> {
  const provider = moonbeam.evmClient.getProvider();

  return Promise.all(
    assets.map(async (a): Promise<MoxitBalance> => {
      try {
        const balance = (await provider.readContract({
          abi: Abi.Erc20,
          address: a.address,
          functionName: 'balanceOf',
          args: [account as `0x${string}`],
        })) as bigint;
        return { ...a, balance };
      } catch (e: any) {
        return { ...a, balance: 0n, error: e?.message ?? String(e) };
      }
    })
  );
}

/** Human-readable amount from raw units, trimmed to 6 significant fraction digits. */
export function formatUnits(raw: bigint, decimals: number): string {
  const negative = raw < 0n;
  const abs = negative ? -raw : raw;
  const base = 10n ** BigInt(decimals);
  const whole = abs / base;
  const frac = abs % base;

  let out = whole.toString();
  if (frac > 0n) {
    const fracStr = frac.toString().padStart(decimals, '0').replace(/0+$/, '');
    if (fracStr) out += '.' + fracStr.slice(0, 6);
  }
  return (negative ? '-' : '') + out;
}
