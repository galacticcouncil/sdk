/**
 * verify-v3-lark4.ts — check the SDK's client-side Uniswap v3 venue math against
 * a real deployment.
 *
 * The SDK quotes v3 off-chain (UniswapV3Math walks the tick list locally) while
 * execution goes through the runtime. If the local walk disagrees with the pool,
 * the router will mis-price the venue. This reads live pool state from lark4,
 * runs the SDK's own math over it, and diffs the result against QuoterV2 — the
 * same contract the runtime's executor calls.
 *
 *   npx tsx packages/sdk-next/scripts/verify-v3-lark4.ts
 */
import { createPublicClient, http, parseAbi } from 'viem';

import { UniswapV3Math } from '../src/pool/uniswapv3/UniswapV3Math';
import { ticksInWord } from '../src/pool/uniswapv3/UniswapV3PoolClient';
import type { V3PoolState, V3Tick } from '../src/pool/uniswapv3/types';

const RPC = process.env.RPC ?? 'https://node4.lark.hydration.cloud';
const FACTORY = (process.env.FACTORY ??
  '0x5FbDB2315678afecb367f032d93F642f64180aa3') as `0x${string}`;
const QUOTER = (process.env.QUOTER ??
  '0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e') as `0x${string}`;
const ASSET_A = Number(process.env.ASSET_A ?? 5); // DOT
const ASSET_B = Number(process.env.ASSET_B ?? 222); // HOLLAR
const FEE = Number(process.env.FEE ?? 3000);
const TICK_WINDOW_WORDS = 5;

const FACTORY_ABI = parseAbi([
  'function getPool(address,address,uint24) view returns (address)',
  'function feeAmountTickSpacing(uint24) view returns (int24)',
]);
const POOL_ABI = parseAbi([
  'function slot0() view returns (uint160 sqrtPriceX96,int24 tick,uint16 observationIndex,uint16 observationCardinality,uint16 observationCardinalityNext,uint8 feeProtocol,bool unlocked)',
  'function liquidity() view returns (uint128)',
  'function tickBitmap(int16) view returns (uint256)',
  'function ticks(int24) view returns (uint128 liquidityGross,int128 liquidityNet,uint256 feeGrowthOutside0X128,uint256 feeGrowthOutside1X128,int56 tickCumulativeOutside,uint160 secondsPerLiquidityOutsideX128,uint32 secondsOutside,bool initialized)',
]);
const QUOTER_ABI = parseAbi([
  'function quoteExactInputSingle((address tokenIn,address tokenOut,uint256 amountIn,uint24 fee,uint160 sqrtPriceLimitX96)) returns (uint256 amountOut,uint160 sqrtPriceX96After,uint32 initializedTicksCrossed,uint256 gasEstimate)',
]);

/** Same derivation the SDK uses: ERC20.fromAssetId -> 0x…01 ++ assetId. */
const assetToEvm = (id: number) =>
  ('0x' + (0x0100000000n + BigInt(id)).toString(16).padStart(40, '0')) as `0x${string}`;

async function main() {
  const client = createPublicClient({ transport: http(RPC) });

  const addrA = assetToEvm(ASSET_A);
  const addrB = assetToEvm(ASSET_B);
  const [token0, token1] =
    addrA.toLowerCase() < addrB.toLowerCase() ? [addrA, addrB] : [addrB, addrA];
  const aIsToken0 = token0 === addrA;

  const pool = await client.readContract({
    abi: FACTORY_ABI, address: FACTORY, functionName: 'getPool', args: [token0, token1, FEE],
  });
  if (pool === '0x0000000000000000000000000000000000000000') throw new Error('pool not found');
  const tickSpacing = await client.readContract({
    abi: FACTORY_ABI, address: FACTORY, functionName: 'feeAmountTickSpacing', args: [FEE],
  });

  const [slot0, liquidity] = await Promise.all([
    client.readContract({ abi: POOL_ABI, address: pool, functionName: 'slot0' }),
    client.readContract({ abi: POOL_ABI, address: pool, functionName: 'liquidity' }),
  ]);
  const tick = slot0[1];

  // mirror UniswapV3PoolClient.loadTicks
  const currentWord = Math.floor(tick / tickSpacing) >> 8;
  const words: number[] = [];
  for (let w = currentWord - TICK_WINDOW_WORDS; w <= currentWord + TICK_WINDOW_WORDS; w++) words.push(w);
  const bitmaps = await Promise.all(
    words.map((w) => client.readContract({ abi: POOL_ABI, address: pool, functionName: 'tickBitmap', args: [w] }))
  );
  const indices = words.flatMap((w, i) => ticksInWord(bitmaps[i], w, tickSpacing));
  const infos = await Promise.all(
    indices.map((i) => client.readContract({ abi: POOL_ABI, address: pool, functionName: 'ticks', args: [i] }))
  );
  const ticks: V3Tick[] = indices.map((index, i) => ({
    index, liquidityGross: infos[i][0], liquidityNet: infos[i][1],
  }));
  // the client also pushes usable min/max sentinels so the walk is bounded
  const MIN = Math.ceil(-887272 / tickSpacing) * tickSpacing;
  const MAX = Math.floor(887272 / tickSpacing) * tickSpacing;
  for (const idx of [MIN, MAX]) {
    if (!ticks.some((t) => t.index === idx)) ticks.push({ index: idx, liquidityNet: 0n, liquidityGross: 0n });
  }
  ticks.sort((a, b) => a.index - b.index);

  console.log(`pool         ${pool}`);
  console.log(`token0/1     ${token0} / ${token1}  (asset ${ASSET_A} is token${aIsToken0 ? 0 : 1})`);
  console.log(`slot0.tick   ${tick}  sqrtPriceX96 ${slot0[0]}`);
  console.log(`liquidity    ${liquidity}  tickSpacing ${tickSpacing}`);
  console.log(`ticks loaded ${ticks.length} (indices ${ticks.map((t) => t.index).join(', ')})\n`);

  const state: V3PoolState = {
    fee: FEE,
    sqrtPriceX96: slot0[0],
    tick,
    liquidity,
    tickSpacing,
    ticks,
  };

  // DOT has 10 decimals -> 1e10 raw = 1 DOT
  const sizes = [10n ** 10n, 10n ** 12n, 10n ** 13n, 10n ** 14n, 5n * 10n ** 14n];
  let worstBps = 0n;
  console.log('amountIn (raw)        SDK out              QuoterV2 out         drift');
  for (const amountIn of sizes) {
    const sdkOut = UniswapV3Math.calculateOutGivenIn(state, aIsToken0, amountIn);
    const { result } = await client.simulateContract({
      abi: QUOTER_ABI, address: QUOTER, functionName: 'quoteExactInputSingle',
      args: [{ tokenIn: addrA, tokenOut: addrB, amountIn, fee: FEE, sqrtPriceLimitX96: 0n }],
    });
    const chainOut = result[0] as bigint;
    const diff = sdkOut > chainOut ? sdkOut - chainOut : chainOut - sdkOut;
    const bps = chainOut === 0n ? 9999n : (diff * 10000n) / chainOut;
    if (bps > worstBps) worstBps = bps;
    console.log(
      `${String(amountIn).padEnd(21)} ${String(sdkOut).padEnd(20)} ${String(chainOut).padEnd(20)} ${bps} bps${diff === 0n ? ' (exact)' : ` (${diff})`}`
    );
  }

  // gross (fee-less) must exceed net by roughly the fee
  const grossState = { ...state, fee: 0 };
  const probe = 10n ** 13n;
  const gross = UniswapV3Math.calculateOutGivenIn(grossState, aIsToken0, probe);
  const net = UniswapV3Math.calculateOutGivenIn(state, aIsToken0, probe);
  const feeBps = ((gross - net) * 10000n) / gross;
  console.log(`\nfee convention: gross ${gross} vs net ${net} -> ${feeBps} bps (pool fee ${FEE / 100} bps)`);

  console.log(`\nworst drift vs QuoterV2: ${worstBps} bps`);
  if (worstBps > 1n) {
    console.log('FAIL: SDK v3 math disagrees with the on-chain quoter');
    process.exit(1);
  }
  console.log('PASS: SDK v3 math matches the on-chain quoter');
}

main().catch((e) => {
  console.error('FAILED:', e);
  process.exit(1);
});
