const esmOnlyPackages = [];
const esmOnlyNamespaces = ['@thi.ng'];

export function externalizePackages(except = []) {
  const esmOnly = esmOnlyPackages.concat(except);
  const esmOnlySet = new Set(esmOnly);
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

        const esmNs = esmOnlyNamespaces.find((ns) => args.path.startsWith(ns));
        if (esmNs) {
          return;
        }

        if (esmOnlySet.has(args.path)) {
          const namespace = args.importer
            .replace(args.resolveDir, '')
            .replace('/', '');
          console.log('ⓘ Found external import', args.path, 'in', namespace);
          return;
        }

        return { path: args.path, external: true };
      });
    },
  };
}
