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
