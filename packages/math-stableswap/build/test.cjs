const { recalculate_peg } = require('./index.cjs');

const bnFormatter = (_, nestedValue) => {
  return typeof nestedValue === 'bigint' ? nestedValue.toString() : nestedValue;
};

const main = async () => {
  const recalculated = recalculate_peg(
    JSON.stringify(
      [
        [85473939039997170n, 57767685517430457n],
        [1, 1],
      ],
      bnFormatter
    ),
    '10',
    JSON.stringify(
      [
        [[85561836215176576n, 57778334052239089n], 10],
        [[1, 1], 10],
      ],
      bnFormatter
    ),
    '20',
    '0.01',
    '0.02'
  );

  console.log(recalculated);
};

main()
  .then(() => console.log('Executed'))
  .catch(console.error)
  .finally(() => process.exit(0));
