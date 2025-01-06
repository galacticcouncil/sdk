const esmOnlyPackages = ['@thi.ng/memoize', '@thi.ng/cache'];

export function externalizePackages(except = []) {
  const noExt = esmOnlyPackages.concat(except);
  const noExtSet = new Set(noExt);
  return {
    name: 'noExternal-plugin',
    setup(build) {
      build.onResolve({ filter: /(.*)/ }, (args) => {
        if (
          args.kind !== 'import-statement' ||
          args.path.startsWith('.') ||
          args.path.startsWith('@/')
        ) {
          return;
        }

        if (noExtSet.has(args.path)) {
          console.log('ⓘ Bundle external:', args.path);
          return;
        }

        return { path: args.path, external: true };
      });
    },
  };
}
