import { writeFileSync } from 'fs';

import applyReleasePlan from '@changesets/apply-release-plan';
import getReleasePlan from '@changesets/get-release-plan';

import { read } from '@changesets/config';
import { getPackages } from '@manypkg/get-packages';

import { parseArgs } from './common.mjs';
import { getUpgradeMessage } from './changeset-utils.mjs';

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
  const output = params['output'];

  releasePlan.releases = releasePlan.releases
    .filter((r) => r.changesets.length > 0)
    .map((r) => {
      r.newVersion = [
        r.newVersion,
        'pr' + pullRequest,
        commitSha.substring(0, 7),
      ].join('-');
    });

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
  await applyReleasePlan(releasePlan, packages, releaseConfig, true);
};

main()
  .then(() => console.log('Snapshot version bump ✅'))
  .catch(console.error)
  .finally(() => process.exit(0));
