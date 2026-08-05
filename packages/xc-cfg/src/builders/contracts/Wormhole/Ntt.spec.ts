import { jest } from '@jest/globals';

import {
  Asset,
  ContractConfig,
  ContractConfigBuilderParams,
  EvmChain,
  EvmParachain,
  Parachain,
  Wormhole,
} from '@galacticcouncil/xc-core';

import { AccountId } from '@polkadot-api/substrate-bindings';

import { aave, eth, sol, usdc, usdc_wh } from '../../../assets';
import { ethereum, hydration, solana } from '../../../chains';

import { encodeNttRequest } from '../../../bridges/wormhole';

import { Ntt } from './Ntt';

const USDC_NTT = {
  token: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  manager: '0x1111111111111111111111111111111111111111',
  transceiver: {
    wormhole: '0x2222222222222222222222222222222222222222',
  },
};

const AAVE_NTT = {
  token: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
  manager: '0x3333333333333333333333333333333333333333',
  transceiver: {
    wormhole: '0x4444444444444444444444444444444444444444',
  },
};

const ETH_NTT = {
  token: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  manager: '0x5555555555555555555555555555555555555555',
  transceiver: {
    wormhole: '0x6666666666666666666666666666666666666666',
  },
};

const H160 = 'd8da6bf26964af9d7eed9e03e53415d37aa96045';
const RECIPIENT_32 = '0x000000000000000000000000' + H160;

/** Whatever `nextMessageSequence` reports; names the message in the request. */
const NEXT_SEQUENCE = 42n;

const toBoundSs58 = (h160: string): string => {
  const publicKey = new Uint8Array(32);
  publicKey.set(Buffer.from('ETH\0'), 0);
  publicKey.set(Buffer.from(h160, 'hex'), 4);
  return AccountId(63).dec(publicKey);
};

const toNativeSs58 = (): string => {
  const publicKey = new Uint8Array(32).fill(1);
  return AccountId(63).dec(publicKey);
};

const buildTransferCtx = (asset: Asset, amount = 1000000n) => {
  return {
    address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    amount: amount,
    asset: asset,
    sender: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    source: {
      chain: ethereum,
    },
    destination: {
      chain: hydration,
      balance: { key: usdc_wh.key },
    },
  } as ContractConfigBuilderParams;
};

// Hydration -> solana: the source is evm, the destination is not, so sender &
// recipient are in formats the other side cannot parse.
const buildSolanaTransferCtx = () => {
  return {
    address: '4Nd1mBQtrMJVYVfKf2PJy9NZUZdTAsp7D4xWLs4gDB4T',
    amount: 100000000n,
    asset: sol,
    sender: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    source: {
      chain: hydration,
    },
    destination: {
      chain: solana,
    },
  } as ContractConfigBuilderParams;
};

const ethereumNtt = Wormhole.fromChain(ethereum).ntt;

describe('Ntt contract builder', () => {
  beforeAll(() => {
    ethereumNtt[usdc.key] = USDC_NTT;
    ethereumNtt[aave.key] = AAVE_NTT;
    ethereumNtt[eth.key] = ETH_NTT;
    const evmClient = {
      getProvider: () => ({
        readContract: async ({ functionName }: { functionName: string }) =>
          functionName === 'nextMessageSequence' ? NEXT_SEQUENCE : [[0n], 0n],
      }),
    } as any;
    jest
      .spyOn(EvmChain.prototype, 'evmClient', 'get')
      .mockReturnValue(evmClient);
    // EvmParachain extends Parachain, not EvmChain - it needs its own stub.
    jest
      .spyOn(EvmParachain.prototype, 'evmClient', 'get')
      .mockReturnValue(evmClient);
    // No bound accounts: EVMAccounts.AccountExtension resolves empty
    jest.spyOn(Parachain.prototype, 'client', 'get').mockReturnValue({
      getUnsafeApi: () => ({
        query: {
          EVMAccounts: {
            AccountExtension: {
              getValue: async () => undefined,
            },
          },
        },
      }),
    } as any);
  });

  afterAll(() => {
    delete ethereumNtt[usdc.key];
    delete ethereumNtt[aave.key];
    delete ethereumNtt[eth.key];
    jest.restoreAllMocks();
  });

  describe('transfer', () => {
    it('should build correct config for usdc ntt transfer to hydration', async () => {
      const ctx = buildTransferCtx(usdc);
      expect(await Ntt().transfer().build(ctx)).toMatchObject({
        address: USDC_NTT.manager,
        args: [1000000n, 73, RECIPIENT_32],
        token: USDC_NTT.token,
        value: 0n,
        func: 'transfer',
        module: 'NttManager',
        type: 'Evm',
      } as ContractConfig);
    });

    it('should flag native gas source to be wrapped', async () => {
      const ctx = buildTransferCtx(eth);
      const config = await Ntt().transfer().build(ctx);
      expect(config.wrapNative).toBe(true);
    });

    it('should not flag erc20 source to be wrapped', async () => {
      const ctx = buildTransferCtx(usdc);
      const config = await Ntt().transfer().build(ctx);
      expect(config.wrapNative).toBe(false);
    });

    it('should floor 18 decimals amount to ntt 8 decimals precision', async () => {
      const ctx = buildTransferCtx(aave, 1123456789123456789n);
      const config = await Ntt().transfer().build(ctx);
      expect(config.args[0]).toBe(1123456780000000000n);
    });

    it('should derive recipient for EVM bound ss58 account', async () => {
      const ctx = buildTransferCtx(usdc);
      ctx.address = toBoundSs58(H160);
      const config = await Ntt().transfer().build(ctx);
      expect(config.args[2]).toBe(RECIPIENT_32);
    });

    it('should reject native (non EVM bound) ss58 account', async () => {
      const ctx = buildTransferCtx(usdc);
      ctx.address = toNativeSs58();
      await expect(Ntt().transfer().build(ctx)).rejects.toThrow(
        'is not an EVM'
      );
    });
  });

  describe('transferWithExecutor', () => {
    const SIGNED_QUOTE = '0xdeadbeef';
    const ESTIMATED_COST = 57578720500000n;

    beforeEach(() => {
      jest.spyOn(globalThis, 'fetch' as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          signedQuote: SIGNED_QUOTE,
          estimatedCost: ESTIMATED_COST.toString(),
        }),
      } as any);
    });

    it('should call the executor shim, not the manager', async () => {
      const ctx = buildTransferCtx(usdc);
      const config = await Ntt().transferWithExecutor().build(ctx);

      expect(config.address).toBe(Wormhole.fromChain(ethereum).nttExecutor);
      expect(config.module).toBe('NttManagerWithExecutor');
      // The manager it forwards to moves into the args.
      expect(config.args[0]).toBe(USDC_NTT.manager);
      expect(config.args[1]).toBe(1000000n);
      expect(config.args[2]).toBe(73);
      expect(config.args[3]).toBe(RECIPIENT_32);
    });

    it('should pay delivery price plus the executor cost', async () => {
      const ctx = buildTransferCtx(usdc);
      const config = await Ntt().transferWithExecutor().build(ctx);

      // Delivery price is mocked to 0 - the value is the executor cost.
      expect(config.value).toBe(ESTIMATED_COST);
      expect(config.args[6]).toMatchObject({
        value: ESTIMATED_COST,
        signedQuote: SIGNED_QUOTE,
      });
    });

    it('should take no referrer fee', async () => {
      const ctx = buildTransferCtx(usdc);
      const config = await Ntt().transferWithExecutor().build(ctx);

      expect(config.args[7]).toMatchObject({
        transferTokenFee: 0n,
        nativeTokenFee: 0n,
      });
    });

    it('should keep the ntt token as the allowance subject', async () => {
      const ctx = buildTransferCtx(usdc);
      const config = await Ntt().transferWithExecutor().build(ctx);

      // Spender is config.address (the shim), derived by the platform.
      expect(config.token).toBe(USDC_NTT.token);
    });

    it('should floor 18 decimals amount to ntt 8 decimals precision', async () => {
      const ctx = buildTransferCtx(aave, 1123456789123456789n);
      const config = await Ntt().transferWithExecutor().build(ctx);
      expect(config.args[1]).toBe(1123456780000000000n);
    });

    it('should fail loudly when the quote is unavailable', async () => {
      jest.spyOn(globalThis, 'fetch' as any).mockResolvedValue({
        ok: false,
      } as any);

      const ctx = buildTransferCtx(usdc);
      await expect(Ntt().transferWithExecutor().build(ctx)).rejects.toThrow(
        'Executor quote failed'
      );
    });

    // Destination gas refunds land on the recipient chain, so the refund arg
    // is the recipient - a sender address is not parseable in the
    // destination's format the moment the two chains disagree on it.
    it('should refund destination gas to the recipient, not the sender', async () => {
      const ctx = buildTransferCtx(usdc);
      ctx.sender = '0x1111111111111111111111111111111111111111';
      const config = await Ntt().transferWithExecutor().build(ctx);

      expect(config.args[4]).toBe(RECIPIENT_32);
      // Source side refund is separate & stays with the sender.
      expect(config.args[6]).toMatchObject({ refundAddress: ctx.sender });
    });

    it('should build for a base58 destination out of an h160 sender', async () => {
      const ctx = buildSolanaTransferCtx();
      const config = await Ntt().transferWithExecutor().build(ctx);

      expect(config.args[4]).toBe(config.args[3]);
      expect(config.args[4]).toBe(
        Wormhole.fromChain(solana).normalizeAddress(ctx.address)
      );
    });
  });

  describe('transferViaExecutor', () => {
    const SIGNED_QUOTE = '0xdeadbeef';
    const ESTIMATED_COST = 57578720500000n;

    beforeEach(() => {
      jest.spyOn(globalThis, 'fetch' as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          signedQuote: SIGNED_QUOTE,
          estimatedCost: ESTIMATED_COST.toString(),
        }),
      } as any);
    });

    // The whole point of the bypass: the manager is called directly, so the
    // only approve is our own exact-amount one. The shim's unbounded approve
    // is what hydration's erc20 precompile rejects.
    it('should call the manager, not the shim', async () => {
      const config = await Ntt()
        .transferViaExecutor()
        .build(buildTransferCtx(usdc));

      expect(config.address).toBe(USDC_NTT.manager);
      expect(config.module).toBe('NttManager');
      expect(config.token).toBe(USDC_NTT.token);
      expect(config.args).toEqual([1000000n, 73, RECIPIENT_32]);
    });

    it('should pay only the delivery price on the transfer', async () => {
      const config = await Ntt()
        .transferViaExecutor()
        .build(buildTransferCtx(usdc));

      // Delivery price is mocked to 0 - the executor cost rides on the follow.
      expect(config.value).toBe(0n);
    });

    it('should follow with a paid executor request', async () => {
      const config = await Ntt()
        .transferViaExecutor()
        .build(buildTransferCtx(usdc));

      expect(config.follow).toBeDefined();
      expect(config.follow!.module).toBe('Executor');
      expect(config.follow!.func).toBe('requestExecution');
      expect(config.follow!.address).toBe(
        Wormhole.fromChain(ethereum).executor
      );
      expect(config.follow!.value).toBe(ESTIMATED_COST);
    });

    it('should name the message by the manager next sequence', async () => {
      const config = await Ntt()
        .transferViaExecutor()
        .build(buildTransferCtx(usdc));

      const requestBytes = config.follow!.args[4] as string;
      expect(requestBytes).toBe(
        encodeNttRequest(2, USDC_NTT.manager, NEXT_SEQUENCE)
      );
      // ERN1 prefix, then the source chain.
      expect(requestBytes.startsWith('0x45524e310002')).toBe(true);
    });

    // dstAddr is whom the executor calls to redeem - the far-side manager, not
    // the recipient. Sending the recipient here buys a relay to a wallet.
    it('should target the destination manager, not the recipient', async () => {
      const config = await Ntt()
        .transferViaExecutor()
        .build(buildTransferCtx(usdc));

      const hydrationNtt = Wormhole.fromChain(hydration).ntt[usdc_wh.key];
      expect(config.follow!.args[1]).toBe(
        Wormhole.fromChain(hydration).normalizeAddress(hydrationNtt.manager)
      );
      expect(config.follow!.args[1]).not.toBe(RECIPIENT_32);
    });

    it('should pass the signed quote & relay instructions through', async () => {
      const config = await Ntt()
        .transferViaExecutor()
        .build(buildTransferCtx(usdc));

      expect(config.follow!.args[3]).toBe(SIGNED_QUOTE);
      expect(config.follow!.args[5]).toMatch(/^0x01/);
    });

    it('should fail loudly when the quote is unavailable', async () => {
      jest
        .spyOn(globalThis, 'fetch' as any)
        .mockResolvedValue({ ok: false } as any);

      await expect(
        Ntt().transferViaExecutor().build(buildTransferCtx(usdc))
      ).rejects.toThrow('Executor quote failed');
    });
  });
});
