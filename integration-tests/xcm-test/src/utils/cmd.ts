const PARAM_PREFIX = '-';

export const parseArgs = (args: string[]) => {
  const parsedArgs: { [key: string]: string } = {};

  args.forEach((arg, i) => {
    if (arg.startsWith(PARAM_PREFIX)) {
      const key = arg.replace(PARAM_PREFIX, '');
      parsedArgs[key] = args[++i];
    }
  });
  return parsedArgs;
};
