import { jest } from '@jest/globals';

import {
  Asset,
  ContractConfig,
  ContractConfigBuilderParams,
  EvmChain,
  Wormhole,
} from '@galacticcouncil/xc-core';

import { AccountId } from '@polkadot-api/substrate-bindings';

import { aave, usdc } from '../../../assets';
import { ethereum, hydration } from '../../../chains';

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

const H160 = 'd8da6bf26964af9d7eed9e03e53415d37aa96045';
const RECIPIENT_32 = '0x000000000000000000000000' + H160;

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
    },
  } as ContractConfigBuilderParams;
};

const ethereumNtt = Wormhole.fromChain(ethereum).ntt;

describe('Ntt contract builder', () => {
  beforeAll(() => {
    ethereumNtt[usdc.key] = USDC_NTT;
    ethereumNtt[aave.key] = AAVE_NTT;
    jest.spyOn(EvmChain.prototype, 'evmClient', 'get').mockReturnValue({
      getProvider: () => ({
        readContract: async () => [[0n], 0n],
      }),
    } as any);
  });

  afterAll(() => {
    delete ethereumNtt[usdc.key];
    delete ethereumNtt[aave.key];
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

    // Live EVMAccounts.AccountExtension query - cold rpc handshake
    // regularly exceeds the default 5s budget.
    it('should reject native (non EVM bound) ss58 account', async () => {
      const ctx = buildTransferCtx(usdc);
      ctx.address = toNativeSs58();
      await expect(Ntt().transfer().build(ctx)).rejects.toThrow(
        'is not an EVM'
      );
    }, 30_000);
  });
});
