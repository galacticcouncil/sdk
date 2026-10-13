import { jest } from '@jest/globals';

import {
  AnyChain,
  OmniClient,
  OmniConnector,
  PaymentConfigBuilderParams,
  ZecBalanceType,
  ZecChain,
} from '@galacticcouncil/xc-core';

import { zec } from '../../../assets';
import { hydration, near_chain } from '../../../chains';

import { Ntt } from './Ntt';

const H160 = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
const MSG =
  '{"recipient_chain":73,"recipient":"0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045"}';

const SENDER = 't1NyxCchMSJD5bUhKhKFzFnFnqEtvLbxMEG';
const DEPOSIT = 't1X5xYTgZRQtAnjwYBebHtrjSWBcfEmyLzx';
const MANAGER = 'ntt-zec.hydration-whm.near';
const AMOUNT = 100_000n;

const CONNECTOR: OmniConnector = {
  account: 'zcash-connector.bridge.near',
  token: 'zec.omft.near',
  minDeposit: 100_000n,
};

/** A fresh zcash chain, so nothing registered leaks between cases. */
const zcashWith = (client?: OmniClient): ZecChain => {
  const chain = new ZecChain({
    key: 'zec',
    name: 'Zcash',
    assetsData: [{ asset: zec, decimals: 8 }],
    balance: ZecBalanceType.Transparent,
  });
  return client ? chain.registerOmniClient(client) : chain;
};

const omniClient = (connector: OmniConnector = CONNECTOR) => ({
  getConnector: jest.fn((_chain: string) => connector),
  getConnectorConfig: jest.fn(async () => ({
    min_deposit_amount: '100000',
    refund_timelock_sec: 172_800,
  })),
  getDepositAddress: jest.fn(async (_order: unknown) => DEPOSIT),
});

const ctxFor = (
  chain: AnyChain,
  overrides: Partial<PaymentConfigBuilderParams> = {}
) =>
  ({
    address: H160,
    amount: AMOUNT,
    asset: zec,
    sender: SENDER,
    source: { chain },
    destination: { chain: hydration },
    ...overrides,
  }) as PaymentConfigBuilderParams;

describe('Omni ntt payment builder', () => {
  const builder = Ntt().transfer(near_chain);

  it('should order the deposit into the near manager for the hydration recipient', async () => {
    const client = omniClient();

    await builder.build(ctxFor(zcashWith(client)));

    expect(client.getConnector).toHaveBeenCalledWith('zcash');
    expect(client.getDepositAddress).toHaveBeenCalledTimes(1);
    const [order] = client.getDepositAddress.mock.calls[0] as [any];
    expect(order).toEqual({
      chain: 'zcash',
      recipient: MANAGER,
      msg: MSG,
      refundAddress: SENDER,
    });
    // The deposit address derives from the exact msg string.
    expect(order.msg).toBe(MSG);
  });

  it('should pay the derived address the full amount, floored at the connector minimum', async () => {
    const [config] = await builder.build(ctxFor(zcashWith(omniClient())));

    expect(config).toMatchObject({
      to: DEPOSIT,
      amount: AMOUNT,
      min: 100_000n,
      type: 'Zec',
      module: 'Omni',
      func: 'safeDeposit',
    });
  });

  it('should surface a deposit address the client failed to resolve', async () => {
    const client = omniClient();
    client.getDepositAddress.mockRejectedValueOnce(
      new Error('Omni deposit address failed: 502 bad gateway')
    );

    await expect(builder.build(ctxFor(zcashWith(client)))).rejects.toThrow(
      'Omni deposit address failed: 502'
    );
  });

  it('should fail closed without a registered omni client', async () => {
    await expect(builder.build(ctxFor(zcashWith()))).rejects.toThrow(
      'No Omni client registered on Zcash'
    );
  });

  it('should refuse a refund address that is not a zcash address', async () => {
    const client = omniClient();

    await expect(
      builder.build(ctxFor(zcashWith(client), { sender: 'alice.near' }))
    ).rejects.toThrow('Omni refunds to a Zcash address only');
    expect(client.getDepositAddress).not.toHaveBeenCalled();
  });

  it('should refuse a connector minting another token than the manager locks', async () => {
    const client = omniClient({ ...CONNECTOR, token: 'other.omft.near' });

    await expect(builder.build(ctxFor(zcashWith(client)))).rejects.toThrow(
      'Omni mints zcash as other.omft.near, not the zec.omft.near'
    );
    expect(client.getDepositAddress).not.toHaveBeenCalled();
  });

  it('should refuse a source omni takes no deposits from', async () => {
    await expect(builder.build(ctxFor(hydration))).rejects.toThrow(
      'Omni takes no deposits from hydration'
    );
  });
});
