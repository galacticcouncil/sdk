import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

import applyReleasePlan from '@changesets/apply-release-plan';
import getReleasePlan from '@changesets/get-release-plan';

import { read } from '@changesets/config';
import { getPackages } from '@manypkg/get-packages';

import { parseArgs } from './common.mjs';
import { getUpgradeMessage } from './changeset-utils.mjs';

const DEP_FIELDS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
];

/**
 * Snapshot versions are prereleases, and semver ranges (^2.2.0) never match a
 * prerelease. Workspace packages depending on a bumped package are not part of
 * the release plan, so they keep a range that no longer resolves, which drops
 * the internal dependency edge from turbo's build graph and breaks build order.
 * Pin those ranges to the exact snapshot version.
 */
const pinSnapshotDependents = (packages, releases) => {
  const bumped = new Map(releases.map((r) => [r.name, r.newVersion]));

  for (const pkg of packages.packages) {
    const pkgJsonPath = path.join(pkg.dir, 'package.json');
    const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));

    let changed = false;
    for (const field of DEP_FIELDS) {
      const deps = pkgJson[field];
      if (!deps) continue;
      for (const name of Object.keys(deps)) {
        const version = bumped.get(name);
        if (!version || deps[name] === version) continue;
        deps[name] = version;
        changed = true;
        console.log(`Pinned ${pkgJson.name} ${field}.${name} -> ${version}`);
      }
    }
    if (changed) {
      writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + '\n');
    }
  }
};

const main = async () => {
  const cwd = process.cwd();
  const args = process.argv.slice(2);
  const params = parseArgs(args);

  const packages = await getPackages(cwd);
  console.log('Packages ready ✅');
  const config = await read(cwd, packages);
  console.log('Config ready ✅');

  const releaseConfig = {
    ...config,
    commit: false,
  };

  const releasePlan = await getReleasePlan(cwd, undefined);
  console.log('Release plan ready ✅');

  const pullRequest = params['pr'];
  const commitSha = params['sha'];
  const output = params['output'];

  const releases = releasePlan.releases
    .filter((r) => r.changesets.length > 0)
    .map((r) => {
      return {
        ...r,
        newVersion: [
          r.newVersion,
          'pr' + pullRequest,
          commitSha.substring(0, 7),
        ].join('-'),
      };
    });

  releasePlan.releases = releases;

  if (output) {
    const releaseMessage = getUpgradeMessage(releasePlan);
    const releaseJson = JSON.stringify(
      {
        releases: releasePlan.releases,
        releaseMessage: releaseMessage,
      },
      null,
      2
    );
    writeFileSync(output, releaseJson);
  }
  console.log('Executing release plan...');
  await applyReleasePlan(releasePlan, packages, releaseConfig, true);

  pinSnapshotDependents(packages, releasePlan.releases);
};

main()
  .then(() => console.log('Snapshot version bump done ✅'))
  .catch(console.error);
