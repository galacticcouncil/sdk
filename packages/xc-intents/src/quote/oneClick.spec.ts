import { jest } from '@jest/globals';
import { OneClickService } from '@defuse-protocol/one-click-sdk-typescript';

import { depositAddressOf, oneClickDeposit } from './oneClick';

const A = 'ab'.repeat(32);
const ADDRESS = '0x' + '44'.repeat(20);

describe('oneClickDeposit', () => {
  afterEach(() => jest.restoreAllMocks());

  it('asks for a standing deposit to A and takes its Ethereum address', async () => {
    const getQuote = jest
      .spyOn(OneClickService, 'getQuote')
      .mockImplementation(((req: any) =>
        Promise.resolve({
          quoteRequest: req,
          quote: {
            chainDepositAddresses: [
              { blockchain: 'near', address: A },
              { blockchain: 'eth', address: ADDRESS },
            ],
          },
        })) as any);

    await expect(oneClickDeposit(A)).resolves.toEqual({
      address: ADDRESS,
      recipient: A,
      refundTo: A,
    });
    expect(getQuote.mock.calls[0][0]).toMatchObject({
      dry: false,
      swapType: 'ANY_INPUT',
      originAsset: '1cs_v1:any',
      destinationAsset: '1cs_v1:original',
      recipient: A,
      recipientType: 'INTENTS',
      refundTo: A,
      refundType: 'INTENTS',
    });
  });

  it('throws without an Ethereum address', async () => {
    jest.spyOn(OneClickService, 'getQuote').mockResolvedValue({
      quoteRequest: { recipient: A, refundTo: A },
      quote: { chainDepositAddresses: [] },
    } as any);
    await expect(oneClickDeposit(A)).rejects.toThrow(/no Ethereum deposit/);
  });
});

describe('depositAddressOf', () => {
  it('takes a deposit crediting A', () => {
    expect(
      depositAddressOf({ address: ADDRESS, recipient: A, refundTo: A }, A)
    ).toBe('0x4444444444444444444444444444444444444444');
  });

  it('refuses one naming another account', () => {
    expect(() =>
      depositAddressOf({ address: ADDRESS, recipient: 'x', refundTo: A }, A)
    ).toThrow(/does not credit/);
    expect(() =>
      depositAddressOf({ address: ADDRESS, recipient: A, refundTo: 'x' }, A)
    ).toThrow(/does not credit/);
  });

  it('refuses a non-EVM address', () => {
    expect(() =>
      depositAddressOf({ address: 'bc1q', recipient: A, refundTo: A }, A)
    ).toThrow(/no EVM address/);
  });
});
