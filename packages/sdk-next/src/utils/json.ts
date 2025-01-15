export function findNestedKey(obj: any, keyToFind: any) {
  const foundObj: any[] = [];
  JSON.stringify(obj, (_, nestedValue) => {
    if (nestedValue && nestedValue[keyToFind]) {
      foundObj.push(nestedValue);
    }
    return nestedValue;
  });
  return foundObj[0];
}

export function findNestedObj(obj: any, keyToFind: any, valToFind: any) {
  let foundObj: any;
  JSON.stringify(obj, (_, nestedValue) => {
    if (nestedValue && nestedValue[keyToFind] === valToFind) {
      foundObj = nestedValue;
    }
    return nestedValue;
  });
  return foundObj;
}
