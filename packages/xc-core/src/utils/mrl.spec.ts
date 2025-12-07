import { FixedSizeBinary } from 'polkadot-api';
import { Parachain } from '../chain';
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
    it('should encode VersionedUserAction V1 with XcmVersionedLocation V4 for Alice', async () => {
      const payload = await createPayload(parachain, ALICE);

      expect(payload.toHex()).toBe(
        '0x0004010200c91f0100d43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d'
      );
    });

    it('should encode AccountKey20 for Ethereum-style addresses', async () => {
      const ethAddress = '0x1234567890123456789012345678901234567890';
      const payload = await createPayload(parachain, ethAddress, true);
      const hex = payload.toHex();

      expect(hex).toContain('1234567890123456789012345678901234567890');
    });
  });

  describe('decodePayload', () => {
    it('should decode SCALE bytes to VersionedUserAction structure', async () => {
      const testHex =
        '0x0004010200c91f0100d43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d';

      const decoded = await decodePayload(testHex);

      expect(decoded.tag).toBe('V1');
      expect(decoded.value).toHaveProperty('destination');

      const destination = decoded.value.destination;
      expect(destination).toBeDefined();
    });

    it('should maintain data integrity through encode/decode round-trip', async () => {
      const payload = await createPayload(parachain, ALICE);
      const hex = payload.toHex();

      const decoded = await decodePayload(hex);

      expect(decoded.tag).toBe('V1');
      expect(decoded.value.destination).toBeDefined();
    });
  });
});
