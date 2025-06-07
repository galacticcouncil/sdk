import { aave } from '../../../../src';

import { BENEFICIARY } from '../../const';

const main = async () => {
  const api = new aave.AaveUtils();
  const result = await api.getHealthFactorAfterSupply(
    BENEFICIARY,
    15, // vDOT
    '16' // supply 16 vDOTs
  );
  console.log(result);
};

main()
  .then(() => console.log('Get HF after supply complete ✅'))
  .catch(console.error)
  .finally(() => process.exit(0));
