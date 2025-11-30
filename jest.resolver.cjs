module.exports = (path, options) => {
  // Force using source files for internal packages during tests
  if (path === '@galacticcouncil/common') {
    return options.defaultResolver(path, {
      ...options,
      packageFilter: (pkg) => {
        // Override to use source files directly
        return {
          ...pkg,
          main: './src/index.ts',
        };
      },
    });
  }

  if (path === '@galacticcouncil/xcm2-core') {
    return options.defaultResolver(path, {
      ...options,
      packageFilter: (pkg) => {
        return {
          ...pkg,
          main: './src/index.ts',
        };
      },
    });
  }

  if (path === '@galacticcouncil/sdk-next') {
    return options.defaultResolver(path, {
      ...options,
      packageFilter: (pkg) => {
        return {
          ...pkg,
          main: './src/index.ts',
        };
      },
    });
  }

  if (path === '@galacticcouncil/xcm2-cfg') {
    return options.defaultResolver(path, {
      ...options,
      packageFilter: (pkg) => {
        return {
          ...pkg,
          main: './src/index.ts',
        };
      },
    });
  }

  if (path === '@galacticcouncil/xcm2-sdk') {
    return options.defaultResolver(path, {
      ...options,
      packageFilter: (pkg) => {
        return {
          ...pkg,
          main: './src/index.ts',
        };
      },
    });
  }

  // Use default resolver for everything else
  return options.defaultResolver(path, options);
};
