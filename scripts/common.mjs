import { exec } from 'child_process';

const PARAM_PREFIX = '--';

export const sh = async (cmd) => {
  return new Promise(function (resolve, reject) {
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        reject(err);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
};

export const parseArgs = (args) => {
  const parsedArgs = {};

  args.forEach((arg, i) => {
    if (arg.startsWith(PARAM_PREFIX)) {
      const key = arg.replace(PARAM_PREFIX, '');
      parsedArgs[key] = args[++i];
    }
  });
  return parsedArgs;
};
