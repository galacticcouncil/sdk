import { AaveUtils, bnum } from '../../../src';

const main = async () => {
  const aave = new AaveUtils();

  const result = await aave.getMaxWithdraw(
    '5E7Uymkt8FaoUk5PC3JFPW6RAMkiu6FNJCD4qMuwpdDL4HbZ',
    '15'
  );
  const result2 = await aave.getHealthFactorAfterWithdraw(
    '5E7Uymkt8FaoUk5PC3JFPW6RAMkiu6FNJCD4qMuwpdDL4HbZ',
    '5',
    bnum('160000000000')
  );
  const result3 = await aave.getHealthFactorAfterSupply(
    '5E7Uymkt8FaoUk5PC3JFPW6RAMkiu6FNJCD4qMuwpdDL4HbZ',
    '15',
    bnum('160000000000')
  );
  console.log(result);
  console.log(result2);
  console.log(result3);
};

main()
  .then(() => console.log('Router call complete ✅'))
  .catch(console.error)
  .finally(() => process.exit(0));
