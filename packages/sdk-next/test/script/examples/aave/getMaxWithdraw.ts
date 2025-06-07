import { aave } from '../../../../src';

import { BENEFICIARY } from '../../const';

const main = async () => {
  const api = new aave.AaveUtils();
  const result = await api.getMaxWithdraw(BENEFICIARY, 15);
  console.log(result);
};

main()
  .then(() => console.log('Get MAX withdraw complete ✅'))
  .catch(console.error)
  .finally(() => process.exit(0));
