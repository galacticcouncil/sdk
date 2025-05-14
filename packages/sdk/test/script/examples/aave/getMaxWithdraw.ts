import { AaveUtils } from '../../../../src';

const BENEFICIARY = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';

const main = async () => {
  const aave = new AaveUtils();
  const result = await aave.getMaxWithdraw(BENEFICIARY, '15');
  console.log(result);
};

main()
  .then(() => console.log('Get MAX withdraw  complete ✅'))
  .catch(console.error)
  .finally(() => process.exit(0));
