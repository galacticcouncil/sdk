import {
  Asset,
  ContractConfig,
  ContractConfigBuilderParams,
} from '@galacticcouncil/xc-core';

import { dai, eth } from '../../../assets';
import { ethereum, hydration, moonbeam } from '../../../chains';

import { TokenBridge } from './TokenBridge';

const buildTransferCtx = (asset: Asset) => {
  return {
    address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    amount: 1000000000000000000n,
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

describe('TokenBridge contract builder', () => {
  describe('transferTokensWithPayload', () => {
    it('should build correct config for erc20 mrl transfer to hydration', async () => {
      const ctx = buildTransferCtx(dai);
      expect(
        await TokenBridge()
          .transferTokensWithPayload()
          .viaMrl({ moonchain: moonbeam })
          .build(ctx)
      ).toMatchObject({
        address: '0x3ee18B2214AFF97000D974cf647E7C347E8fa585',
        args: [
          '0x6B175474E89094C44Da98b954EedeAC495271d0F',
          1000000000000000000n,
          16,
          '0x0000000000000000000000000000000000000000000000000000000000000816',
          0,
          '0x0004010200c91f0100d43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d',
        ],
        func: 'transferTokensWithPayload',
        module: 'TokenBridge',
        type: 'Evm',
      } as ContractConfig);
    });
  });

  describe('wrapAndTransferETHWithPayload', () => {
    it('should build correct config for native eth mrl transfer to hydration', async () => {
      const ctx = buildTransferCtx(eth);
      expect(
        await TokenBridge()
          .wrapAndTransferETHWithPayload()
          .viaMrl({ moonchain: moonbeam })
          .build(ctx)
      ).toMatchObject({
        address: '0x3ee18B2214AFF97000D974cf647E7C347E8fa585',
        args: [
          16,
          '0x0000000000000000000000000000000000000000000000000000000000000816',
          0,
          '0x0004010200c91f0100d43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d',
        ],
        func: 'wrapAndTransferETHWithPayload',
        module: 'TokenBridge',
        type: 'Evm',
      } as ContractConfig);
    });
  });
});
