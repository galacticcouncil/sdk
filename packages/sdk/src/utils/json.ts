export function findNestedKey(obj: any, keyToFind: any) {
  let foundObj: any;
  JSON.stringify(obj, (_, nestedValue) => {
    if (nestedValue && nestedValue[keyToFind]) {
      foundObj = nestedValue;
    }
    return nestedValue;
  });
  return foundObj;
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
