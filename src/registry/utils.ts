import * as fs from 'fs';

export const readJsonOrReturnEmptyObject = (path: string) => {
  try {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
  } catch (e) {
    return {};
  }
};

export const writeJsonSync = (path: string, data: any) => {
  fs.writeFileSync(path, JSON.stringify(data, null, 4));
};

export function pairs2Map<T>(pairs: [string, T][]): Map<string, T> {
  const result = new Map<string, T>();
  pairs.forEach((pair: [string, T]) => result.set(pair[0], pair[1]));
  return result;
}
