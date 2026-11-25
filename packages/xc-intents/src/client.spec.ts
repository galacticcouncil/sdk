import { jest } from '@jest/globals';
import { base58 } from '@scure/base';

import { decodeAbiParameters, getAddress } from 'viem';

import { XcIntentsClient } from './client';
import { authPathOf, encodeTerms } from './terms/codec';
import { XcIntentsError, type SwapParams } from './types';

const ALICE = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
const REFUND = getAddress('0x15fdd31c61141abd04a99fd6822c8558854ccde3');
const ZEC = 'nep141:zec.omft.near';
const ZEC_ADDR = 't1KPVSRgnFHPBWMJLC7taJioN6m5Q6jVBma';
const A = 'ab'.repeat(32);
const DEPOSIT = `0x${'44'.repeat(20)}`;
const DISPATCHER = '0x2c967d7e00a18c1c926fd77de733a27c3fdb3f2b';

/** ZEC at 0.18 per ETH: zat per 1e18 wei. */
const OUT_PER_IN = 18_000_000n;
const CEILING = 317n * 10n ** 12n;
const COST = 10n ** 12n;

const DOT = 5;
const WETH = 20;

/** Records a sdk-next builder chain and returns it from `build`. */
function builder(name: string) {
  const calls: Record<string, unknown> = {};
  const b: any = new Proxy(
    {},
    {
      get: (_, key: string) =>
        key === 'build'
          ? async () => ({ name, calls })
          : (value: unknown) => {
              calls[key] = value;
              return b;
            },
    }
  );
  return b;
}

function mockSdk(opts: { sellOut?: bigint; outPerIn?: bigint } = {}) {
  const readContract = jest.fn(async ({ functionName, args }: any) => {
    switch (functionName) {
      case 'computeTerms':
        return encodeTerms(args[0]);
      case 'computeAuthPath':
        return authPathOf(encodeTerms(args[0]));
      case 'outPerIn':
        return opts.outPerIn ?? OUT_PER_IN;
      case 'minOrderAmount':
        return 10n ** 11n;
      case 'nttManager':
        return `0x${'aa'.repeat(20)}`;
      case 'wormhole':
        return `0x${'bb'.repeat(20)}`;
      case 'quoteDeliveryPrice':
        return [[COST - 1n], COST - 1n];
      case 'messageFee':
        return 1n;
      case 'closed':
        return false;
      case 'allowance':
        return 0n;
    }
    throw new Error(functionName);
  });
  return {
    api: {
      router: {
        getBestBuy: jest.fn(async () => ({ amountIn: 777n })),
        getBestSell: jest.fn(async () => ({
          amountOut: opts.sellOut ?? 10n ** 18n,
          tradeFee: 0n,
          priceImpactPct: 0,
        })),
      },
    },
    client: {
      asset: {
        getSupported: jest.fn(async () => [
          { id: DOT, symbol: 'DOT', existentialDeposit: 10n },
          { id: WETH, symbol: 'WETH', existentialDeposit: 10n },
        ]),
      },
      evm: { getProvider: () => ({ readContract }) },
    },
    tx: {
      intentMarket: jest.fn(() => builder('market')),
      intentOrder: jest.fn(() => builder('order')),
    },
  } as any;
}

const near = {
  view: jest.fn(async (_: string, method: string, args: any) => {
    if (method === 'utxo_routes') {
      return {
        [ZEC]: {
          withdraw: 'withdraw-zec.near',
          path_prefix: 'zec:',
          address_prefixes: ['t1', 't3'],
          min_amount: '100000',
        },
      };
    }
    if (method === 'path_of') {
      if (args.address === ZEC_ADDR) return 'ok';
      throw new Error('invalid address');
    }
    if (method === 'derived_public_key') {
      return `ed25519:${base58.encode(new Uint8Array(32).fill(0xab))}`;
    }
    throw new Error(method);
  }),
  viewAccount: jest.fn(async () => undefined),
} as any;

function client(
  opts: { sellOut?: bigint; outPerIn?: bigint; passTo?: string } = {}
) {
  return new XcIntentsClient({
    sdk: mockSdk(opts),
    near,
    passThrough: async () => ({
      address: DEPOSIT,
      recipient: opts.passTo ?? A,
      refundTo: opts.passTo ?? A,
    }),
  });
}

const swapParams: SwapParams = {
  account: ALICE,
  assetIn: DOT,
  amountIn: 10n ** 12n,
  destination: ZEC,
  recipient: ZEC_ADDR,
  refundTo: REFUND,
};

function mockCeiling(...ceilings: bigint[]) {
  let i = 0;
  global.fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({
      feeRequested: ceilings[Math.min(i++, ceilings.length - 1)].toString(),
    }),
  })) as any;
}

describe('XcIntentsClient', () => {
  const realFetch = global.fetch;
  beforeEach(() => mockCeiling(CEILING));
  afterEach(() => {
    global.fetch = realFetch;
  });

  describe('swap estimate', () => {
    it('sizes a viable swap to the route minimum', async () => {
      const trade = await client().swap(swapParams);

      expect(trade.errors).toEqual([]);
      expect(trade.kind).toBe('swap');
      expect(trade.tranches).toBe(1);
      expect(trade.wethOut).toBe(10n ** 18n);
      expect(trade.minWethOut).toBe((10n ** 18n * 99n) / 100n);
      expect(trade.leastIn).toBe(777n);
      expect(trade.destination.routeMin).toBe(100_000n);
      expect(trade.minAmountOut).toBeGreaterThan(100_000n);
      expect(trade.amountOut).toBeGreaterThan(trade.minAmountOut);
      expect(trade.fees).toEqual({
        maxRelayFee: CEILING,
        orderCost: COST,
        payout: 20_000n,
      });
    });

    it('throws for an unsupported destination', async () => {
      await expect(
        client().swap({ ...swapParams, destination: 'nep141:eth.omft.near' })
      ).rejects.toThrow(/Unsupported destination/);
    });
  });

  describe('viability errors', () => {
    it.each<[XcIntentsError, Partial<SwapParams>, object]>([
      [XcIntentsError.RecipientRejected, { recipient: 't1Bad' }, {}],
      [XcIntentsError.InvalidRefundAddress, { refundTo: 'nope' }, {}],
      [XcIntentsError.Unpriced, {}, { outPerIn: 0n }],
      [XcIntentsError.BelowExistentialDeposit, { amountIn: 5n }, {}],
      [XcIntentsError.OrderTooSmall, {}, { sellOut: 10n ** 12n }],
    ])('reports %s', async (error, patch, opts) => {
      const trade = await client(opts).swap({ ...swapParams, ...patch });
      expect(trade.errors).toContain(error);
    });

    it.each<[XcIntentsError, object]>([
      [XcIntentsError.InvalidTranches, { tranches: 0 }],
      [XcIntentsError.InvalidPeriod, { tranches: 4, period: 10 }],
      [
        XcIntentsError.MinDeliveryBelowRouteMin,
        { tranches: 4, minDelivery: 99_999n },
      ],
      [XcIntentsError.WethTwap, { tranches: 4, assetIn: WETH }],
    ])('reports %s on a TWAP', async (error, patch) => {
      const trade = await client().twap({
        ...swapParams,
        tranches: 1,
        ...patch,
      });
      expect(trade.errors).toContain(error);
    });

    it('reports a TWAP whose whole schedule cannot reach the route minimum', async () => {
      const probe = await client().twap({ ...swapParams, tranches: 2 });
      // Each trade clears `least`, but two of them at the floor stay under 100000 zat.
      const perTrade = (probe.least * 101n) / 99n;
      const trade = await client({ sellOut: perTrade }).twap({
        ...swapParams,
        tranches: 2,
      });
      expect(trade.errors).toEqual([XcIntentsError.ScheduleBelowRouteMin]);
    });

    it('refuses to build a non-viable trade', async () => {
      const trade = await client({ sellOut: 10n ** 12n }).swap(swapParams);
      await expect(trade.buildCall()).rejects.toThrow(/OrderTooSmall/);
    });
  });

  describe('buildCall', () => {
    it('fixes the terms and builds the forwarded ICE swap', async () => {
      const trade = await client().swap(swapParams);
      const req = await trade.buildCall();

      expect(req.kind).toBe('intent');
      expect(req.depositAccount).toBe(A);
      expect(req.depositAddress).toBe(getAddress(DEPOSIT));
      expect(req.authPath).toBe(authPathOf(req.encoded));
      expect(req.terms.maxFillMultiplier).toBe(2);
      expect(req.terms.minDelivery).toBe(100_000n);
      expect(req.terms.minOutPerIn).toBe((OUT_PER_IN * 8000n) / 10_000n);

      const { calls } = (req as any).tx;
      expect(calls.withMinAmountOut).toBe(trade.minWethOut);
      expect(req.terms.deadline).toBe(calls.withDeadline / 1000n + 3600n);
      expect(calls.withForward.contract).toBe(DISPATCHER);

      const [deposit, ceiling, terms] = decodeAbiParameters(
        [{ type: 'address' }, { type: 'uint256' }, { type: 'bytes' }],
        calls.withForward.data
      );
      expect(deposit).toBe(getAddress(DEPOSIT));
      expect(ceiling).toBe(CEILING);
      expect(terms).toBe(req.encoded);
    });

    it('builds a TWAP with a fill multiplier per tranche and no deadline', async () => {
      const trade = await client().twap({ ...swapParams, tranches: 12 });
      expect(trade.amountInPerTrade).toBe(swapParams.amountIn / 12n);
      const req = await trade.buildCall();
      expect(req.terms.maxFillMultiplier).toBe(12);
      expect((req as any).tx.name).toBe('order');
      expect((req as any).tx.calls.withDeadline).toBeUndefined();
    });

    it('builds approve + dispatch calldata for WETH itself', async () => {
      const trade = await client().swap({
        ...swapParams,
        assetIn: WETH,
        amountIn: 10n ** 16n,
      });
      const req = await trade.buildCall();
      expect(req.kind).toBe('dispatch');
      if (req.kind === 'dispatch') {
        expect(req.calls).toHaveLength(2);
        expect(req.calls[1].from).toBe(req.terms.owner);
      }
    });

    it('refuses a pass-through to another account', async () => {
      const trade = await client({ passTo: 'cd'.repeat(32) }).swap(swapParams);
      await expect(trade.buildCall()).rejects.toThrow(/does not forward/);
    });

    it('refuses when the relay ceiling rose past the order', async () => {
      const probe = await client().swap(swapParams);
      // Just clears `least` after slippage; a doubled ceiling raises `least` past it.
      const sellOut = (probe.least * 100n) / 99n + 10n ** 12n;
      const trade = await client({ sellOut }).swap(swapParams);
      expect(trade.errors).toEqual([]);
      mockCeiling(2n * CEILING);
      await expect(trade.buildCall()).rejects.toThrow(/estimate again/);
    });
  });

  describe('closeCalls', () => {
    it('builds close calldata from the owner, paying the message fee', async () => {
      const req = await (await client().swap(swapParams)).buildCall();
      const [close] = await client().closeCalls(req.terms);
      expect(close.from).toBe(req.terms.owner);
      expect(close.value).toBe(1n);
      await expect(client().closeCalls(req.terms, 86_401)).rejects.toThrow(
        /delay/
      );
    });
  });
});
