const { recalculate_peg } = require('./index.cjs');

const bnFormatter = (_, nestedValue) => {
  return typeof nestedValue === 'bigint' ? nestedValue.toString() : nestedValue;
};

const main = async () => {
  const relaculated = recalculate_peg(
    JSON.stringify(
      [
        [85473939039997170n, 57767685517430457n],
        [1, 1],
      ],
      bnFormatter
    ),
    JSON.stringify(
      [
        [[85561836215176576n, 57778334052239089n], 79926],
        [[1, 1], 79926],
      ],
      bnFormatter
    ),
    '80462',
    '0.01',
    '0.02'
  );

  console.log(relaculated);
};

main()
  .then(() => console.log('Executed'))
  .catch(console.error)
  .finally(() => process.exit(0));
