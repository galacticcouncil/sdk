import { jest } from '@jest/globals';

import { OneClickService } from '@defuse-protocol/one-click-sdk-typescript';

import { withdrawZec } from './withdraw';
import { XcSwapError } from '../types';

const FROM = 'alice.near';
const RECIPIENT = 't1NyxCchMSJD5bUhKhKFzFnFnqEtvLbxMEG';
const DEPOSIT =
  '405402736f7430a891ab7b8a5cfe9323314cc6fdf5073df2737a519b8c853369';

const quoted = (dry: boolean) => ({
  quote: {
    amountOut: '968000',
    minAmountOut: '958320',
    timeEstimate: 135,
    ...(dry ? {} : { depositAddress: DEPOSIT }),
  },
  correlationId: dry ? 'dry' : 'firm',
});

describe('withdrawZec', () => {
  afterEach(() => jest.restoreAllMocks());

  it('should pay the deposit address of a zec on near quote', async () => {
    const getQuote = jest
      .spyOn(OneClickService, 'getQuote')
      .mockImplementation(async (req: any) => quoted(req.dry) as any);

    const withdrawal = await withdrawZec({
      from: FROM,
      amount: 1_000_000n,
      recipient: RECIPIENT,
    });
    expect(withdrawal).toMatchObject({
      amountOut: 968_000n,
      fee: 32_000n,
      errors: [],
    });

    const { call, depositAddress } = await withdrawal.buildCall();
    expect(getQuote.mock.calls[1][0]).toMatchObject({
      dry: false,
      originAsset: '1cs_v1:near:nep141:zec.omft.near',
      destinationAsset: 'nep141:zec.omft.near',
      amount: '1000000',
      recipient: RECIPIENT,
      refundTo: FROM,
    });
    expect(depositAddress).toBe(DEPOSIT);
    expect(call).toMatchObject({ from: FROM, receiverId: 'zec.omft.near' });
    expect(call.actions.map((a) => [a.methodName, a.args])).toEqual([
      ['storage_deposit', { account_id: DEPOSIT, registration_only: true }],
      ['ft_transfer', { receiver_id: DEPOSIT, amount: '1000000' }],
    ]);
  });

  it('should report an amount below the bridge minimum', async () => {
    jest.spyOn(OneClickService, 'getQuote').mockRejectedValue({
      body: { message: 'Amount is too low for bridge, try at least 133334' },
    });

    const withdrawal = await withdrawZec({
      from: FROM,
      amount: 100_000n,
      recipient: RECIPIENT,
    });
    expect(withdrawal.errors).toEqual([XcSwapError.AmountTooLow]);
    await expect(withdrawal.buildCall()).rejects.toThrow('non-viable');
  });
});
