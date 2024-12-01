export const jsonFormatter = (_: any, nestedValue: any) => {
  return typeof nestedValue === 'bigint' ? nestedValue.toString() : nestedValue;
};

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
