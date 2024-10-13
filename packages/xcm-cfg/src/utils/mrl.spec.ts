import { createPayload } from './mrl';

import { hydration } from '../chains';

describe('Mrl utils', () => {
  describe('createPayload', () => {
    it('should get correct mrl payload for alice on hydration', async () => {
      expect(
        createPayload(
          hydration,
          '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'
        )
      ).toStrictEqual(
        '0x0001010200c91f0100d43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d'
      );
    });
  });
});
