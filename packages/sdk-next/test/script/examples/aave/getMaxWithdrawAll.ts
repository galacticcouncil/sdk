import { aave } from '../../../../src';

import { BENEFICIARY } from '../../const';

const main = async () => {
  const api = new aave.AaveUtils();
  const result = await api.getMaxWithdrawAll(BENEFICIARY);
  console.log(result);
};

main()
  .then(() => console.log('Get MAX withdraw ALL complete ✅'))
  .catch(console.error)
  .finally(() => process.exit(0));
