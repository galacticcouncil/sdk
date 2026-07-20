export const jsonFormatter = (_: any, nestedValue: any) => {
  return typeof nestedValue === 'bigint' ? nestedValue.toString() : nestedValue;
};

export const findNestedKey = (obj: any, key: string): any => {
  if (obj && typeof obj === 'object') {
    if (key in obj) {
      return obj[key];
    }
    for (const k in obj) {
      const result = findNestedKey(obj[k], key);
      if (result !== undefined) {
        return result;
      }
    }
  }
  return undefined;
};
