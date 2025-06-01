import { AaveUtils } from '../../../../src';

import { BENEFICIARY } from '../../const';

const main = async () => {
  const aave = new AaveUtils();
  const result = await aave.getHealthFactorAfterSupply(
    BENEFICIARY,
    '15', // vDOT
    '16' // supply 16 vDOTs
  );
  console.log(result);
};

main()
  .then(() => console.log('Get HF after supply complete ✅'))
  .catch(console.error)
  .finally(() => process.exit(0));
