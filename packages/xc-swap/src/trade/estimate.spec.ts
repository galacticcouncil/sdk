import { jest } from '@jest/globals';

import {
  OneClickService,
  type QuoteResponse,
} from '@defuse-protocol/one-click-sdk-typescript';

import { keccak256, encodeAbiParameters, decodeFunctionData } from 'viem';

import { createXcSwap } from '../factory';
import { SWAP_AND_BRIDGE_ABI } from './abi';
import { WETH_ID, GLMR_ID } from '../registry/consts';

const DOT_ID = 5;
const DOT_DECIMALS = 10;

const ASSETS = [
  { id: DOT_ID, symbol: 'DOT', decimals: DOT_DECIMALS },
  { id: WETH_ID, symbol: 'WETH', decimals: 18 },
  { id: GLMR_ID, symbol: 'GLMR', decimals: 18 },
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
const DEADLINE = new Date('2026-06-17T12:00:00.000Z');

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

describe('estimateTrade', () => {
  let getQuoteSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    (global as any).fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({ feeRequested: RELAY_FEE.toString() }),
    }));

    getQuoteSpy = jest.spyOn(OneClickService, 'getQuote').mockResolvedValue({
      correlationId: CORRELATION_ID,
      quote: {
        depositAddress: DEPOSIT,
        amountIn: QUOTE_AMOUNT_IN,
        amountOut: QUOTE_AMOUNT_OUT,
        minAmountOut: QUOTE_MIN_OUT,
        timeEstimate: 120,
      },
    } as QuoteResponse);
  });

  afterEach(() => jest.restoreAllMocks());

  it('quotes the 1Click leg with the relay fee skimmed', async () => {
    const router = mockRouter();
    const xcSwap = createXcSwap({ router, assets: ASSETS, emitter: EMITTER });

    const trade = await xcSwap.estimateTrade({
      assetIn: DOT_ID,
      amountIn: 10_000_000_000n,
      recipient: 'alice.near',
      refundTo: REFUND,
      deadline: DEADLINE,
    });

    // relay fee comes straight from the quoter
    expect(trade.maxRelayFee).toBe(RELAY_FEE);
    // bridged WETH == sell output; min applies 1% slippage floor
    expect(trade.wethOut.amount).toBe(WETH_OUT);
    expect(trade.minEthOut.amount).toBe((WETH_OUT * 9900n) / 10000n);
    // maxFeeIn is the fee-buy input padded up by slippage
    expect(trade.maxFeeIn.amount).toBe((FEE_IN * 10100n) / 10000n);

    // 1Click sized to wethOut - maxRelayFee
    const req = getQuoteSpy.mock.calls[0][0];
    expect(req.amount).toBe((WETH_OUT - RELAY_FEE).toString());
    expect(req.destinationAsset).toBe('nep141:wrap.near');
    expect(req.recipient).toBe('alice.near');

    // destination amounts surfaced
    expect(trade.amountOut.amount).toBe(BigInt(QUOTE_AMOUNT_OUT));
    expect(trade.amountOut.decimals).toBe(24);
    expect(trade.priceImpactPct).toBe(0.42);
  });

  it('computes intentId per the nirViaWtt payload', async () => {
    const router = mockRouter();
    const xcSwap = createXcSwap({ router, assets: ASSETS, emitter: EMITTER });

    const trade = await xcSwap.estimateTrade({
      assetIn: DOT_ID,
      amountIn: 10_000_000_000n,
      recipient: 'alice.near',
      refundTo: REFUND,
      deadline: DEADLINE,
    });

    const expected = keccak256(
      encodeAbiParameters(
        [
          { type: 'string' },
          { type: 'address' },
          { type: 'uint256' },
          { type: 'string' },
        ],
        [
          CORRELATION_ID,
          DEPOSIT as `0x${string}`,
          BigInt(QUOTE_AMOUNT_IN),
          DEADLINE.toISOString(),
        ]
      )
    );
    expect(trade.intentId).toBe(expected);
  });

  it('builds [approve, swapAndBridge] with the expected args', async () => {
    const router = mockRouter();
    const xcSwap = createXcSwap({ router, assets: ASSETS, emitter: EMITTER });

    const trade = await xcSwap.estimateTrade({
      assetIn: DOT_ID,
      amountIn: 10_000_000_000n,
      recipient: 'alice.near',
      refundTo: REFUND,
      deadline: DEADLINE,
    });

    const [approve, swapAndBridge] = trade.buildCalls();

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
    expect(intentId).toBe(trade.intentId);
    expect(deposit.toLowerCase()).toBe(DEPOSIT.toLowerCase());
    expect(relay).toBe(RELAY_FEE);
  });

  it('rejects when the bridged WETH cannot cover the relay fee', async () => {
    const router = mockRouter();
    router.getBestSell = jest.fn(async () => ({
      amountIn: 0n,
      amountOut: RELAY_FEE - 1n,
      priceImpactPct: 0,
    }));
    const xcSwap = createXcSwap({ router, assets: ASSETS, emitter: EMITTER });

    await expect(
      xcSwap.estimateTrade({
        assetIn: DOT_ID,
        amountIn: 10_000_000_000n,
        recipient: 'alice.near',
        refundTo: REFUND,
        deadline: DEADLINE,
      })
    ).rejects.toThrow(/must exceed maxRelayFee/);
  });
});
