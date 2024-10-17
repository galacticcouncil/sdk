import { writeFileSync } from 'fs';

import applyReleasePlan from '@changesets/apply-release-plan';
import getReleasePlan from '@changesets/get-release-plan';

import { read } from '@changesets/config';
import { getPackages } from '@manypkg/get-packages';

import { parseArgs } from './common.mjs';

const main = async () => {
  const cwd = process.cwd();
  const args = process.argv.slice(2);
  const params = parseArgs(args);

  const packages = await getPackages(cwd);
  const config = await read(cwd, packages);
  const releaseConfig = {
    ...config,
    commit: false,
  };

  const releasePlan = await getReleasePlan(cwd, undefined);
  const pullRequest = params['pr'];
  const commitSha = params['sha'];

  releasePlan.releases.map((r) => {
    r.newVersion = [
      r.newVersion,
      'pr' + pullRequest,
      commitSha.substring(0, 7),
    ].join('-');
  });

  const releasePlanJson = JSON.stringify(releasePlan, null, 2);
  writeFileSync('../releasePlan.json', releasePlanJson);
  await applyReleasePlan(releasePlan, packages, releaseConfig, true);
};

main()
  .then(() => console.log('Snapshot version bump ✅'))
  .catch(console.error)
  .finally(() => process.exit(0));
