import { aave } from '../../../../src';

import { BENEFICIARY } from '../../const';

const main = async () => {
  const api = new aave.AaveUtils();

  const hf = await api.getHealthFactor(BENEFICIARY);
  console.log(hf);

  const result = await api.getHealthFactorAfterWithdraw(
    BENEFICIARY,
    15, // vDOT
    '16' // Withdraw 16 avDOTs
  );
  console.log(result);
};

main()
  .then(() => console.log('Get HF after withdraw complete ✅'))
  .catch(console.error)
  .finally(() => process.exit(0));
