import { chainsMap } from '@galacticcouncil/xc-cfg';
import { EvmParachain } from '@galacticcouncil/xc-core';

import { getDepositMsg } from './omni';

const H160 = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
const REFUND = 'hydration.sputnik-dao.near';

describe('getDepositMsg', () => {
  // Omni derives the deposit address from this exact string: a change in key
  // order or spacing moves every address.
  it('should pin the msg of an h160 hydration recipient', async () => {
    const hydration = chainsMap.get('hydration') as EvmParachain;

    expect(await getDepositMsg(hydration, H160, REFUND)).toBe(
      '{"recipient_chain":73,"recipient":"0x000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045","refund_to":"hydration.sputnik-dao.near"}'
    );
  });
});
