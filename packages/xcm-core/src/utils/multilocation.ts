const GLOBAL_CONSENSUS_KEY = 'GlobalConsensus';
const PARACHAIN_KEY = 'Parachain';
const GENERAL_INDEX_KEY = 'GeneralIndex';

export const findNestedKey = (multilocation: object, keyToFind: any) => {
  const foundObj: any[] = [];
  JSON.stringify(multilocation, (_, nestedValue) => {
    const v =
      typeof nestedValue === 'bigint' ? nestedValue.toString() : nestedValue;
    if (nestedValue && nestedValue[keyToFind]) {
      foundObj.push(v);
    }
    return v;
  });
  return foundObj[0];
};

export const findGlobalConsensus = (multilocation: object) => {
  const globalConsensus = findNestedKey(multilocation, GLOBAL_CONSENSUS_KEY);
  return globalConsensus && globalConsensus[GLOBAL_CONSENSUS_KEY];
};

export const findParachain = (multilocation: object) => {
  const parachain = findNestedKey(multilocation, PARACHAIN_KEY);
  return parachain && parachain[PARACHAIN_KEY];
};

export const findGeneralIndex = (multilocation: object) => {
  const generalIndex = findNestedKey(multilocation, GENERAL_INDEX_KEY);
  return generalIndex && generalIndex[GENERAL_INDEX_KEY];
};
