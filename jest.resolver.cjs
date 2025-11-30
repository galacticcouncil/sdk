const localPackages = new Set([
  '@galacticcouncil/common',
  '@galacticcouncil/sdk-next',
  '@galacticcouncil/xc-core',
  '@galacticcouncil/xc-cfg',
  '@galacticcouncil/xc-sdk',
]);

function resolver(path, options) {
  if (localPackages.has(path)) {
    return options.defaultResolver(path, {
      ...options,
      packageFilter(pkg) {
        return {
          ...pkg,
          main: './src/index.ts',
        };
      },
    });
  }

  // default for everything else
  return options.defaultResolver(path, options);
}

module.exports = resolver;
