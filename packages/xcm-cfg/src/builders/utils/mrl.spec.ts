import { Parachain } from '@galacticcouncil/xcm-core';

import { createPayload, decodePayload } from './mrl';

const ALICE = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';

const parachain = new Parachain({
  assetsData: [],
  genesisHash: '0x',
  key: 'hydration',
  name: 'Hydration',
  parachainId: 2034,
  ss58Format: 63,
  ws: [],
});

describe('Mrl utils', () => {
  describe('createPayload', () => {
    it('should create correct VersionedMultiLocation payload hex for alice on hydration', async () => {
      expect(createPayload(parachain, ALICE).toHex()).toStrictEqual(
        '0x0001010200c91f0100d43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d'
      );
    });
  });
  describe('decodePayload', () => {
    it('should decode payload hex to correct VersionedMultiLocation json for alice on hydration', async () => {
      expect(
        decodePayload(
          '0x0001010200c91f0100d43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d'
        )
      ).toStrictEqual({
        v1: {
          interior: {
            x2: [
              { parachain: 2034 },
              {
                accountId32: {
                  id: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
                  network: { any: null },
                },
              },
            ],
          },
          parents: 1,
        },
      });
    });
  });
});
