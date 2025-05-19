import { AaveUtils } from '../../../../src';

const BENEFICIARY = '7L53bUTBopuwFt3mKUfmkzgGLayYa1Yvn1hAg9v5UMrQzTfh';

const main = async () => {
  const aave = new AaveUtils();
  const result = await aave.getHealthFactorAfterWithdraw(
    BENEFICIARY,
    '15', // vDOT
    '16' // Withdraw 16 avDOTs
  );
  console.log(result);
};

main()
  .then(() => console.log('Get HF after withdraw complete ✅'))
  .catch(console.error)
  .finally(() => process.exit(0));
