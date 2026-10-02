import { PolkadotClient } from 'polkadot-api';

import { big } from '@galacticcouncil/common';

import { createSdkContext } from '../../../../src';

import { PapiExecutor } from '../../PapiExecutor';
import { BENEFICIARY } from '../../const';
import { ApiUrl } from '../../types';

class GetMaxWithdraw extends PapiExecutor {
  async script(client: PolkadotClient) {
    const sdk = await createSdkContext(client);

    const { api } = sdk;

    // aDOT: capped by the main market's health factor and liquidity
    const { amount, decimals } = await api.aave.getMaxWithdraw(
      BENEFICIARY,
      1001
    );
    console.log(big.toDecimal(amount, decimals));

    return () => {
      sdk.destroy();
      client.destroy();
    };
  }
}

new GetMaxWithdraw(ApiUrl.Hydration, 'Get max withdraw').run();
