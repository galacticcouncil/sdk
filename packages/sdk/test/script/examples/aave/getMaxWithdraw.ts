import { AaveUtils } from '../../../../src';

const BENEFICIARY = '7L53bUTBopuwFt3mKUfmkzgGLayYa1Yvn1hAg9v5UMrQzTfh';

const main = async () => {
  const aave = new AaveUtils();
  const result = await aave.getMaxWithdraw(BENEFICIARY, '15');
  console.log(result);
};

main()
  .then(() => console.log('Get MAX withdraw complete ✅'))
  .catch(console.error)
  .finally(() => process.exit(0));
