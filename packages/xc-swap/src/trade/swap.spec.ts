import { jest } from '@jest/globals';

import {
  OneClickService,
  type QuoteResponse,
  type TokenResponse,
} from '@defuse-protocol/one-click-sdk-typescript';

import { keccak256, encodePacked, decodeFunctionData } from 'viem';

import { SWAP_AND_BRIDGE_ABI } from './abi';
import { createXcSwap } from '../factory';
import { WETH_ID, GLMR_ID, WRAP_NEAR_ASSET } from '../registry/consts';
import { XcSwapError } from '../types';

const DOT_ID = 5;
const DOT_DECIMALS = 10;

const ASSETS = [
  { id: DOT_ID, symbol: 'DOT', decimals: DOT_DECIMALS },
  { id: WETH_ID, symbol: 'WETH', decimals: 18 },
  { id: GLMR_ID, symbol: 'GLMR', decimals: 18 },
] as any;

const TOKENS: TokenResponse[] = [
  {
    assetId: WRAP_NEAR_ASSET,
    decimals: 24,
    blockchain: 'near',
    symbol: 'wNEAR',
    price: 5,
    priceUpdatedAt: '2026-05-28T14:36:00.533Z',
  },
] as any;

const EMITTER = '0x00000000000000000000000000000000000e1117';
const DEPOSIT = '0x000000000000000000000000000000000dead001';
const REFUND = '0x6d116C3E43Bc1bFd4EEBe5c7BF043a342Ea6bBB2';

// Mocked on-Hydration legs.
const FEE_IN = 2_000_000_000n; // DOT spent buying the GLMR fee
const WETH_OUT = 500_000_000_000_000_000n; // bridged WETH
const RELAY_FEE = 1_000_000_000_000_000n; // from the quoter
const QUOTE_AMOUNT_IN = (WETH_OUT - RELAY_FEE).toString();
const QUOTE_AMOUNT_OUT = '4200000000000000000000000'; // wrap.near (24 dp)
const QUOTE_MIN_OUT = '4100000000000000000000000';
const CORRELATION_ID = 'corr-test-1';
const DEADLINE = Date.parse('2026-06-17T12:00:00.000Z');
const DEADLINE_ISO = new Date(DEADLINE).toISOString();

const PARAMS = {
  assetIn: DOT_ID,
  amountIn: 10_000_000_000n,
  destinationAsset: WRAP_NEAR_ASSET,
  recipient: 'alice.near',
  refundTo: REFUND,
  deadline: DEADLINE,
};

function mockRouter() {
  return {
    getBestBuy: jest.fn(async () => ({
      amountIn: FEE_IN,
      amountOut: 1_000_000_000_000_000_000n,
      priceImpactPct: 0,
    })),
    getBestSell: jest.fn(async () => ({
      amountIn: 0n,
      amountOut: WETH_OUT,
      priceImpactPct: 0.42,
    })),
  } as any;
}

/** Minimal sdk-next context stub: router, asset registry and an EVM client
 * whose `allowance` read returns `allowance`. */
function mockSdk(allowance = 0n, router = mockRouter()) {
  return {
    api: { router },
    client: {
      asset: { getSupported: jest.fn(async () => ASSETS) },
      evm: {
        getProvider: () => ({
          readContract: jest.fn(async () => allowance),
        }),
      },
    },
  } as any;
}

function quoteResponse(dry: boolean): QuoteResponse {
  return {
    correlationId: CORRELATION_ID,
    quote: {
      depositAddress: dry ? undefined : DEPOSIT,
      amountIn: QUOTE_AMOUNT_IN,
      amountInUsd: '1000', // USD of the quoted WETH input (0.5 WETH @ $2000)
      amountOut: QUOTE_AMOUNT_OUT,
      minAmountOut: QUOTE_MIN_OUT,
      timeEstimate: 120,
    },
  } as QuoteResponse;
}

describe('swap', () => {
  let getQuoteSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    (global as any).fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({ feeRequested: RELAY_FEE.toString() }),
    }));

    jest.spyOn(OneClickService, 'getTokens').mockResolvedValue(TOKENS);
    getQuoteSpy = jest
      .spyOn(OneClickService, 'getQuote')
      .mockImplementation(((req: any) => quoteResponse(req.dry)) as any);
  });

  afterEach(() => jest.restoreAllMocks());

  it('estimates with a dry quote at full WETH, scaled to net', async () => {
    const xcSwap = createXcSwap({ sdk: mockSdk(), emitter: EMITTER });

    const trade = await xcSwap.swap(PARAMS);

    // dry quote runs in parallel with the relay fee → priced at the full WETH
    const req = getQuoteSpy.mock.calls[0][0] as any;
    expect(req.dry).toBe(true);
    expect(req.amount).toBe(WETH_OUT.toString());
    expect(req.destinationAsset).toBe(WRAP_NEAR_ASSET);
    expect(req.recipient).toBe('alice.near');
    expect(req.deadline).toBe(DEADLINE_ISO);
    // slippage passed to 1Click is bps (default 1% -> 100)
    expect(req.slippageTolerance).toBe(100);

    // outputs scaled to the net that lands (swapAmount) via the quoted rate
    const net = WETH_OUT - RELAY_FEE;
    expect(trade.amountOut.amount).toBe(
      (BigInt(QUOTE_AMOUNT_OUT) * net) / WETH_OUT
    );
    expect(trade.minAmountOut.amount).toBe(
      (BigInt(QUOTE_MIN_OUT) * net) / WETH_OUT
    );
    expect(trade.amountOut.decimals).toBe(24);
    expect(trade.priceImpactPct).toBe(0.42);
    expect(trade.timeEstimate.quote).toBe(120);

    // fee = idealWeth − swapAmount (mock sell is amount-independent → relay fee)
    expect(trade.fee.amount.amount).toBe(RELAY_FEE);
    expect(trade.fee.pct).toBe(0.2);
    expect(trade.fee.usd).toBeCloseTo(2); // 0.001 WETH @ $2000
    // exchange rate: destination units per 1 unit of A
    expect(trade.spotPrice).toBeCloseTo(4.1916, 4);

    // a viable swap carries no errors
    expect(trade.errors).toEqual([]);
  });

  it('buildCall() requests a firm quote and yields the executable request', async () => {
    const xcSwap = createXcSwap({ sdk: mockSdk(), emitter: EMITTER });

    const trade = await xcSwap.swap(PARAMS);
    const request = await trade.buildCall();

    // the firm quote is dry:false and returns the deposit address
    const firmReq = getQuoteSpy.mock.calls.find((c: any) => !c[0].dry)!;
    expect(firmReq).toBeDefined();
    expect(request.depositAddress).toBe(DEPOSIT);

    // intentId per WHM's swapAndBridge.ts: keccak256(packed(depositAddress, amountIn))
    const expectedIntentId = keccak256(
      encodePacked(
        ['address', 'uint256'],
        [DEPOSIT as `0x${string}`, BigInt(PARAMS.amountIn)]
      )
    );
    expect(request.intentId).toBe(expectedIntentId);
    expect(request.correlationId).toBe(CORRELATION_ID);
    expect(request.deadline).toBe(DEADLINE_ISO);

    // calls: [approve, swapAndBridge] (no prior allowance)
    expect(request.calls).toHaveLength(2);
    const [approve, swapAndBridge] = request.calls;
    expect(approve.to).toBe('0x0000000000000000000000000000000100000005');
    expect(approve.from).toBe(REFUND);
    expect(swapAndBridge.to).toBe(EMITTER);

    const decoded = decodeFunctionData({
      abi: SWAP_AND_BRIDGE_ABI,
      data: swapAndBridge.data as `0x${string}`,
    });
    expect(decoded.functionName).toBe('swapAndBridge');
    const [assetIn, amountIn, minEthOut, maxFeeIn, intentId, deposit, relay] =
      decoded.args as readonly [
        number,
        bigint,
        bigint,
        bigint,
        string,
        string,
        bigint,
      ];
    expect(assetIn).toBe(DOT_ID);
    expect(amountIn).toBe(10_000_000_000n);
    expect(minEthOut).toBe((WETH_OUT * 9900n) / 10000n);
    expect(maxFeeIn).toBe((FEE_IN * 10100n) / 10000n);
    expect(intentId).toBe(request.intentId);
    expect(deposit.toLowerCase()).toBe(DEPOSIT.toLowerCase());
    expect(relay).toBe(RELAY_FEE);
  });

  it('buildCall() skips approve when the emitter is already approved', async () => {
    // allowance already covers amountIn
    const xcSwap = createXcSwap({
      sdk: mockSdk(BigInt(PARAMS.amountIn)),
      emitter: EMITTER,
    });

    const trade = await xcSwap.swap(PARAMS);
    const request = await trade.buildCall();

    // only the swapAndBridge call — approve omitted
    expect(request.calls).toHaveLength(1);
    const [swapAndBridge] = request.calls;
    expect(swapAndBridge.to).toBe(EMITTER);
    expect(
      decodeFunctionData({
        abi: SWAP_AND_BRIDGE_ABI,
        data: swapAndBridge.data as `0x${string}`,
      }).functionName
    ).toBe('swapAndBridge');
  });

  it('rejects an unsupported destination asset', async () => {
    const xcSwap = createXcSwap({ sdk: mockSdk(), emitter: EMITTER });

    await expect(
      xcSwap.swap({ ...PARAMS, destinationAsset: 'nep141:foo.near' })
    ).rejects.toThrow(/Unsupported destination asset/);
  });

  it('flags non-viable swaps via errors instead of throwing', async () => {
    const router = mockRouter();
    router.getBestSell = jest.fn(async () => ({
      amountIn: 0n,
      amountOut: RELAY_FEE - 1n,
      priceImpactPct: 0,
    }));
    const xcSwap = createXcSwap({ sdk: mockSdk(0n, router), emitter: EMITTER });

    const trade = await xcSwap.swap(PARAMS);
    expect(trade.errors).toContain(XcSwapError.RelayFeeTooHigh);
  });

  it('maps a 1Click quote API error to a custom error', async () => {
    getQuoteSpy.mockRejectedValueOnce({
      body: { message: 'recipient is not valid' },
    });
    const xcSwap = createXcSwap({ sdk: mockSdk(), emitter: EMITTER });

    const trade = await xcSwap.swap(PARAMS);
    expect(trade.errors).toContain(XcSwapError.RecipientInvalid);
  });
});
