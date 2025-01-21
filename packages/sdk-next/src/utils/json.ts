export const findNestedKey = (obj: any, keyToFind: any) => {
  const foundObj: any[] = [];
  JSON.stringify(obj, (_, nestedValue) => {
    if (nestedValue && nestedValue[keyToFind]) {
      foundObj.push(nestedValue);
    }
    return nestedValue;
  });
  return foundObj[0];
};

export const findNestedObj = (obj: any, keyToFind: any, valToFind: any) => {
  let foundObj: any;
  JSON.stringify(obj, (_, nestedValue) => {
    if (nestedValue && nestedValue[keyToFind] === valToFind) {
      foundObj = nestedValue;
    }
    return nestedValue;
  });
  return foundObj;
};

export const jsonFormatter = (_: any, nestedValue: any) => {
  return typeof nestedValue === 'bigint' ? nestedValue.toString() : nestedValue;
};
