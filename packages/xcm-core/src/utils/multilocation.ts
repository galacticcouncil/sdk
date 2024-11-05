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
