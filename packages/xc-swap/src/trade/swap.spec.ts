import { jest } from '@jest/globals';

import {
  OneClickService,
  type QuoteResponse,
  type TokenResponse,
} from '@defuse-protocol/one-click-sdk-typescript';

import { decodeFunctionData } from 'viem';

import { PLACE_ORDER_ABI } from './abi';
import { createXcSwap } from '../factory';
import { WETH_ID, TRIM_UNIT, WRAP_NEAR_ASSET } from '../registry/consts';
import { XcSwapError } from '../types';

const DOT_ID = 5;
const DOT_DECIMALS = 10;

const ASSETS = [
  { id: DOT_ID, symbol: 'DOT', decimals: DOT_DECIMALS },
  { id: WETH_ID, symbol: 'WETH', decimals: 18 },
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
const NTT_MANAGER = '0x00000000000000000000000000000000000a0001';
const WORMHOLE = '0x00000000000000000000000000000000000a0002';
const DEPOSIT = '0x000000000000000000000000000000000dead001';
const REFUND = '0x6d116C3E43Bc1bFd4EEBe5c7BF043a342Ea6bBB2';

// Mocked on-Hydration legs.
const WETH_OUT = 500_000_000_000_000_000n; // WETH out of the sell
const RELAY_FEE = 1_000_000_000_000_000n; // from the quoter
const DELIVERY_PRICE = 0n; // live value on the prod rail
const MESSAGE_FEE = 0n;
const CAPACITY = 184467440737000000000000000000n; // u64-max sentinel: uncapped

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

/** trim to the rail's precision, mirroring the emitter. */
const trim = (v: bigint) => v - (v % TRIM_UNIT);

function mockRouter(wethOut = WETH_OUT) {
  return {
    getBestBuy: jest.fn(async () => {
      throw new Error('getBestBuy must not be called — no input-side fee leg');
    }),
    getBestSell: jest.fn(async () => ({
      amountIn: 0n,
      amountOut: wethOut,
      priceImpactPct: 0.42,
    })),
  } as any;
}

interface RailOverrides {
  deliveryPrice?: bigint;
  messageFee?: bigint;
  paused?: boolean;
  capacity?: bigint;
}

/**
 * Minimal sdk-next context stub. `readContract` dispatches on functionName so
 * the rail reads and the ERC-20 allowance share one provider.
 */
function mockSdk(
  allowance = 0n,
  router = mockRouter(),
  rail: RailOverrides = {}
) {
  const readContract = jest.fn(async (args: any) => {
    switch (args.functionName) {
      case 'nttManager':
        return NTT_MANAGER;
      case 'wormhole':
        return WORMHOLE;
      case 'quoteDeliveryPrice':
        return [[rail.deliveryPrice ?? DELIVERY_PRICE], rail.deliveryPrice ?? DELIVERY_PRICE];
      case 'messageFee':
        return rail.messageFee ?? MESSAGE_FEE;
      case 'isPaused':
        return rail.paused ?? false;
      case 'getCurrentOutboundCapacity':
        return rail.capacity ?? CAPACITY;
      case 'allowance':
        return allowance;
      default:
        throw new Error(`unexpected read: ${args.functionName}`);
    }
  });

  return {
    api: { router },
    client: {
      asset: { getSupported: jest.fn(async () => ASSETS) },
      evm: { getProvider: () => ({ readContract }) },
    },
  } as any;
}

function quoteResponse(dry: boolean): QuoteResponse {
  return {
    correlationId: CORRELATION_ID,
    quote: {
      depositAddress: dry ? undefined : DEPOSIT,
      amountIn: WETH_OUT.toString(),
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
    const bridged = trim(WETH_OUT - DELIVERY_PRICE - MESSAGE_FEE);
    const net = bridged - RELAY_FEE;
    expect(trade.amountOut.amount).toBe(
      (BigInt(QUOTE_AMOUNT_OUT) * net) / WETH_OUT
    );
    expect(trade.minAmountOut.amount).toBe(
      (BigInt(QUOTE_MIN_OUT) * net) / WETH_OUT
    );
    expect(trade.amountOut.decimals).toBe(24);
    expect(trade.priceImpactPct).toBe(0.42);
    expect(trade.timeEstimate.quote).toBe(120);

    // fee = wethOut − swapAmount = rail cost + trim dust + relay fee
    expect(trade.fee.amount.amount).toBe(WETH_OUT - net);
    expect(trade.fee.usd).toBeCloseTo(2); // 0.001 WETH @ $2000

    // a viable swap carries no errors
    expect(trade.errors).toEqual([]);
  });

  it('sells the whole input — no GLMR fee leg', async () => {
    const router = mockRouter();
    const xcSwap = createXcSwap({
      sdk: mockSdk(0n, router),
      emitter: EMITTER,
    });

    await xcSwap.swap(PARAMS);

    // one sell of the full amountIn, and no buy leg at all
    expect(router.getBestBuy).not.toHaveBeenCalled();
    expect(router.getBestSell).toHaveBeenCalledTimes(1);
    expect(router.getBestSell).toHaveBeenCalledWith(
      DOT_ID,
      WETH_ID,
      BigInt(PARAMS.amountIn)
    );
  });

  it('buildCall() requests a firm quote and yields the executable request', async () => {
    const xcSwap = createXcSwap({ sdk: mockSdk(), emitter: EMITTER });

    const trade = await xcSwap.swap(PARAMS);
    const request = await trade.buildCall();

    // the firm quote is dry:false, sized to the net, and returns the address
    const firmReq = getQuoteSpy.mock.calls.find((c: any) => !c[0].dry)!;
    expect(firmReq).toBeDefined();
    const bridged = trim(WETH_OUT - DELIVERY_PRICE - MESSAGE_FEE);
    expect((firmReq[0] as any).amount).toBe((bridged - RELAY_FEE).toString());
    expect(request.depositAddress).toBe(DEPOSIT);
    expect(request.correlationId).toBe(CORRELATION_ID);
    expect(request.deadline).toBe(DEADLINE_ISO);

    // calls: [approve, placeOrder] (no prior allowance)
    expect(request.calls).toHaveLength(2);
    const [approve, placeOrder] = request.calls;
    expect(approve.to).toBe('0x0000000000000000000000000000000100000005');
    expect(approve.from).toBe(REFUND);
    expect(placeOrder.to).toBe(EMITTER);

    const decoded = decodeFunctionData({
      abi: PLACE_ORDER_ABI,
      data: placeOrder.data as `0x${string}`,
    });
    expect(decoded.functionName).toBe('placeOrder');
    const [assetIn, amountIn, minEthOut, deposit, relay] =
      decoded.args as readonly [number, bigint, bigint, string, bigint];
    expect(assetIn).toBe(DOT_ID);
    expect(amountIn).toBe(10_000_000_000n);
    // floor is expressed against what bridges, quantized to the rail
    expect(minEthOut).toBe(trim((bridged * 9900n) / 10000n));
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

    // only the placeOrder call — approve omitted
    expect(request.calls).toHaveLength(1);
    const [placeOrder] = request.calls;
    expect(placeOrder.to).toBe(EMITTER);
    expect(
      decodeFunctionData({
        abi: PLACE_ORDER_ABI,
        data: placeOrder.data as `0x${string}`,
      }).functionName
    ).toBe('placeOrder');
  });

  it('subtracts the rail cost when the delivery price is non-zero', async () => {
    const deliveryPrice = 20_000_000_000_000_000n; // 0.02 WETH
    const messageFee = 10_000_000_000n;
    const xcSwap = createXcSwap({
      sdk: mockSdk(0n, mockRouter(), { deliveryPrice, messageFee }),
      emitter: EMITTER,
    });

    const trade = await xcSwap.swap(PARAMS);
    const request = await trade.buildCall();

    const bridged = trim(WETH_OUT - deliveryPrice - messageFee);
    const net = bridged - RELAY_FEE;

    // the cost lands in the fee, not silently in the output
    expect(trade.fee.amount.amount).toBe(WETH_OUT - net);
    expect(trade.amountOut.amount).toBe(
      (BigInt(QUOTE_AMOUNT_OUT) * net) / WETH_OUT
    );

    // and the floor is below the bridged amount, so the swap cannot revert
    const { args } = decodeFunctionData({
      abi: PLACE_ORDER_ABI,
      data: request.calls[1].data as `0x${string}`,
    });
    const minEthOut = (args as readonly [number, bigint, bigint, string, bigint])[2];
    expect(minEthOut).toBe(trim((bridged * 9900n) / 10000n));
    expect(minEthOut).toBeLessThan(bridged);
  });

  it('flags a swap that cannot cover the delivery price', async () => {
    const xcSwap = createXcSwap({
      sdk: mockSdk(0n, mockRouter(), { deliveryPrice: WETH_OUT }),
      emitter: EMITTER,
    });

    const trade = await xcSwap.swap(PARAMS);
    expect(trade.errors).toContain(XcSwapError.BelowDeliveryPrice);
  });

  it('flags a paused rail', async () => {
    const xcSwap = createXcSwap({
      sdk: mockSdk(0n, mockRouter(), { paused: true }),
      emitter: EMITTER,
    });

    const trade = await xcSwap.swap(PARAMS);
    expect(trade.errors).toContain(XcSwapError.RailPaused);
  });

  it('flags a settlement above the rail outbound capacity', async () => {
    // shouldQueue is false on the emitter's transfer, so this reverts on-chain
    const xcSwap = createXcSwap({
      sdk: mockSdk(0n, mockRouter(), { capacity: 1_000n }),
      emitter: EMITTER,
    });

    const trade = await xcSwap.swap(PARAMS);
    expect(trade.errors).toContain(XcSwapError.RailRateLimited);
  });

  it('flags a relay fee that swallows the settlement', async () => {
    const router = mockRouter(RELAY_FEE); // bridged == maxRelayFee
    const xcSwap = createXcSwap({ sdk: mockSdk(0n, router), emitter: EMITTER });

    const trade = await xcSwap.swap(PARAMS);
    expect(trade.errors).toContain(XcSwapError.RelayFeeExceedsAmount);
  });

  it('rejects an unsupported destination asset', async () => {
    const xcSwap = createXcSwap({ sdk: mockSdk(), emitter: EMITTER });

    await expect(
      xcSwap.swap({ ...PARAMS, destinationAsset: 'nep141:foo.near' })
    ).rejects.toThrow(/Unsupported destination asset/);
  });

  it('flags non-viable swaps via errors instead of throwing', async () => {
    const router = mockRouter(RELAY_FEE + RELAY_FEE / 2n);
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
