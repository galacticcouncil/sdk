const path = require('path');

const localPackages = new Set([
  '@galacticcouncil/common',
  '@galacticcouncil/sdk-next',
  '@galacticcouncil/xc-core',
  '@galacticcouncil/xc-cfg',
  '@galacticcouncil/xc-sdk',
]);

// Return the source path directly: jest's ESM resolution ignores the
// packageFilter `main` override and would pick the built entrypoints.
function resolver(request, options) {
  if (localPackages.has(request)) {
    const [, name] = request.split('/');
    return path.join(__dirname, 'packages', name, 'src', 'index.ts');
  }

  // default for everything else
  return options.defaultResolver(request, options);
}

module.exports = resolver;
