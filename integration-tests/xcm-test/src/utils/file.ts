import { readFileSync, writeFileSync } from 'fs';

import { jsonFormatter } from './json';

const DB_PATH = './src/__db__/';

export const write = (data: any, db: string) => {
  const json = JSON.stringify(Object.fromEntries(data), jsonFormatter, 2);
  const file = [DB_PATH + db].join('');
  writeFileSync(file, json);
};

export const loadExisting = (db: string) => {
  const file = [DB_PATH + db].join('');
  let jsonString;
  try {
    jsonString = readFileSync(file, { encoding: 'utf8', flag: 'r' });
  } catch {
    jsonString = '{}';
  }

  const jsonObject = JSON.parse(jsonString);
  const jsonMap = new Map();
  for (const key in jsonObject) {
    jsonMap.set(key, jsonObject[key]);
  }
  return jsonMap;
};
