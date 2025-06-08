import { AaveUtils, toDecimals } from '../../../../src';

import { BENEFICIARY } from '../../const';

const main = async () => {
  const aave = new AaveUtils();
  const result = await aave.getMaxWithdrawAll(BENEFICIARY);
  for (const [key, value] of Object.entries(result)) {
    console.log(key, '=>', toDecimals(value.amount, value.decimals));
  }
};

main()
  .then(() => console.log('Get MAX withdraw ALL complete ✅'))
  .catch(console.error)
  .finally(() => process.exit(0));
