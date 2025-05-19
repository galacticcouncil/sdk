import { AaveUtils } from '../../../../src';

const BENEFICIARY = '7L53bUTBopuwFt3mKUfmkzgGLayYa1Yvn1hAg9v5UMrQzTfh';

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
