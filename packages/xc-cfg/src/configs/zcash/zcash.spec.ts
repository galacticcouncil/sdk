import { jest } from '@jest/globals';

import {
  CallType,
  ConfigService,
  ContractConfigBuilderParams,
  DepositConfig,
  DepositConfigBuilderParams,
  NearClient,
} from '@galacticcouncil/xc-core';

import { assetsMap, zec } from '../../assets';
import { chainsMap, hydration, zcash } from '../../chains';
import { routesMap } from '../index';
import { Tag } from '../../tags';

const H160 = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
const SENDER = 't1NyxCchMSJD5bUhKhKFzFnFnqEtvLbxMEG';
const DEPOSIT = 't1X5xYTgZRQtAnjwYBebHtrjSWBcfEmyLzx';

describe('zcash mainnet routes', () => {
  const config = new ConfigService({
    assets: assetsMap,
    chains: chainsMap,
    routes: routesMap,
  });

  const [route] = config.getAssetRoutes(zec, zcash, hydration);

  const ctx = (sender: string) =>
    ({
      address: H160,
      amount: 100_000n,
      asset: zec,
      sender: sender,
      source: { chain: zcash },
      destination: { chain: hydration },
    }) as DepositConfigBuilderParams;

  afterEach(() => jest.restoreAllMocks());

  it('should route zec to hydration through omni', () => {
    expect(config.getAssetRoutes(zec, zcash, hydration)).toHaveLength(1);
    expect(route.destination.asset).toBe(zec);
    expect(route.source.fee?.asset).toBe(zec);
    expect(route.deposit).toBeDefined();
    expect(route.tags).toEqual([Tag.Omni, Tag.Wormhole, Tag.Ntt]);
  });

  it('should pay the deposit address omni orders for the ntt manager', async () => {
    const fetch = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ address: DEPOSIT }),
    } as Response);
    jest
      .spyOn(NearClient.prototype, 'view')
      .mockResolvedValue(DEPOSIT as never);

    const [deposit] = await route.deposit!.build(ctx(SENDER));

    expect(deposit).toBeInstanceOf(DepositConfig);
    expect(deposit).toMatchObject({
      to: DEPOSIT,
      amount: 100_000n,
      min: 100_000n,
      type: CallType.Zec,
    });

    const [, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toMatchObject({
      chain: 'zcash',
      recipient: 'ntt-zec.hydration-whm.near',
      refund_address: SENDER,
    });
  });

  it('should refuse a sender omni cannot refund', async () => {
    await expect(route.deposit!.build(ctx(H160))).rejects.toThrow(
      'Omni refunds to a Zcash address only: ' + H160
    );
  });

  describe('hydration → zcash', () => {
    // whm utxo-withdraw golden vector
    const ADDRESS = 't1KfwsnwJeNRVjQGBDZhwKskpQbih2qx5Ua';
    const KEY = 'ed25519:FhYNkYjdaYj6tAymcRFyRgH8jQNbW5VARJHtvGdEvD3N';
    const ACCOUNT =
      '0xda66533e90179ebb2e9e546afd4410e36f76e8a8b4ec0376b4e2a8825f802e11';

    const [withdrawal] = config.getAssetRoutes(zec, hydration, zcash);

    const sendCtx = (address: string) =>
      ({
        address: address,
        amount: 1_000_000n,
        asset: zec,
        sender: H160,
        source: { chain: hydration },
        destination: { chain: zcash },
      }) as ContractConfigBuilderParams;

    it('should route zec to zcash through the utxo emitter', () => {
      expect(config.getAssetRoutes(zec, hydration, zcash)).toHaveLength(1);
      expect(withdrawal.destination.asset).toBe(zec);
      expect(withdrawal.contract).toBeDefined();
      expect(withdrawal.extrinsic).toBeDefined();
      expect(withdrawal.tags).toEqual([Tag.Omni, Tag.Wormhole, Tag.Ntt]);
    });

    it('should send to the account the address derives', async () => {
      jest
        .spyOn(NearClient.prototype, 'view')
        .mockImplementation((async (_id: string, method: string) =>
          method === 'path_of'
            ? 'zcash:v1:' + ADDRESS
            : KEY) as NearClient['view']);

      const [send] = await withdrawal.contract!.build(sendCtx(ADDRESS));

      expect(send).toMatchObject({
        address: '0xb3e365a6241683d5d4ef2701de6bedc16dcc259e',
        func: 'send',
        args: [
          1_000_000n,
          '0x1cb813bbd8bc8df03a5a9cda88103f583aa8bc043e24',
          ACCOUNT,
        ],
        token: '0x00000000000000000000000000000001000f478d',
      });
      expect(() => send.encodeFunctionData()).not.toThrow();
    });

    it('should refuse an invalid address before deriving', async () => {
      const view = jest.spyOn(NearClient.prototype, 'view');

      await expect(
        withdrawal.contract!.build(
          sendCtx('t1KfwsnwJeNRVjQGBDZhwKskpQbih2qx5Ub')
        )
      ).rejects.toThrow('Not a transparent Zcash address');
      expect(view).not.toHaveBeenCalled();
    });
  });
});
