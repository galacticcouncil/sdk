import { AaveUtils } from '../../../../src';

import { BENEFICIARY } from '../../const';

const main = async () => {
  const aave = new AaveUtils();
  const result = await aave.getMaxWithdrawAll(BENEFICIARY);
  console.log(result);
};

main()
  .then(() => console.log('Get MAX withdraw ALL complete ✅'))
  .catch(console.error)
  .finally(() => process.exit(0));
