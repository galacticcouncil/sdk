import {
  Asset,
  FunctionCallConfigBuilderParams,
} from '@galacticcouncil/xc-core';

import { near, wnear } from '../../../assets';
import { hydration, near_testnet } from '../../../chains';

import { Ntt } from './Ntt';

const H160 = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
const RECIPIENT_32 =
  '0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045';

const NTT = 'ntt-near.whm-ntt-0bugdc.testnet';

const buildTransferCtx = (asset: Asset, amount: bigint) =>
  ({
    address: H160,
    amount: amount,
    asset: asset,
    sender: 'alice.testnet',
    source: {
      chain: near_testnet,
    },
    destination: {
      chain: hydration,
    },
  }) as FunctionCallConfigBuilderParams;

const ONE_WNEAR = 10n ** 24n;

describe('Ntt function call builder', () => {
  describe('transfer', () => {
    it('should hand the token to the manager with ft_transfer_call', async () => {
      const [config] = await Ntt()
        .transfer()
        .build(buildTransferCtx(wnear, ONE_WNEAR));

      expect(config).toMatchObject({
        receiverId: 'wrap.testnet',
        func: 'ft_transfer_call',
        module: 'NttManager',
        type: 'Near',
        deposit: 1n,
      });
      expect(config.args.receiver_id).toBe(NTT);
      expect(config.args.amount).toBe(ONE_WNEAR.toString());
    });

    it('should address hydration by chain id & 32 byte recipient', async () => {
      const [config] = await Ntt()
        .transfer()
        .build(buildTransferCtx(wnear, ONE_WNEAR));

      expect(JSON.parse(config.args.msg as string)).toEqual({
        recipient_chain: 73,
        recipient: RECIPIENT_32,
      });
    });

    // 24 decimals trim to 8 - the dust would come back as a refund.
    it('should floor the amount to ntt 8 decimals precision', async () => {
      const [config] = await Ntt()
        .transfer()
        .build(buildTransferCtx(wnear, 1_234_567_891_234_567_891_234_567n));

      expect(config.args.amount).toBe('1234567890000000000000000');
    });

    it('should flag native near to be wrapped', async () => {
      const [config] = await Ntt()
        .transfer()
        .build(buildTransferCtx(near, ONE_WNEAR));
      expect(config.wrapNative).toBe(true);
      expect(config.receiverId).toBe('wrap.testnet');
    });

    it('should not wrap the token itself', async () => {
      const [config] = await Ntt()
        .transfer()
        .build(buildTransferCtx(wnear, ONE_WNEAR));
      expect(config.wrapNative).toBe(false);
    });
  });
});
