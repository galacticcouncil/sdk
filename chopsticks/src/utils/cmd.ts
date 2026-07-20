const PARAM_PREFIX = '-';

export const parseArgs = (args: string[]) => {
  const parsedArgs: { [key: string]: string } = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith(PARAM_PREFIX)) {
      const key = arg.replace(PARAM_PREFIX, '');
      parsedArgs[key] = args[++i];
    }
  }
  return parsedArgs;
};
