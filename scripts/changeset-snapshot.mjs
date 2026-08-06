import { writeFileSync } from 'fs';
import path from 'path';

import applyReleasePlan from '@changesets/apply-release-plan';
import getReleasePlan from '@changesets/get-release-plan';

import { read } from '@changesets/config';
import * as git from '@changesets/git';
import { getPackages } from '@manypkg/get-packages';

import { parseArgs } from './common.mjs';
import { getReleaseMessage, getUpgradeMessage } from './changeset-utils.mjs';

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
  const touchedFiles = await applyReleasePlan(
    releasePlan,
    packages,
    releaseConfig,
    true
  );

  // Note, git gets angry if two git actions run at once, keep this sequential
  for (const touchedFile of touchedFiles) {
    await git.add(path.relative(cwd, touchedFile), cwd);
  }

  const releaseMessage = getReleaseMessage(releasePlan);
  const committed = await git.commit(releaseMessage, cwd);
  if (committed) {
    console.log(releaseMessage);
  } else {
    throw new Error('Snapshot version bump could not be committed');
  }
};

main()
  .then(() => console.log('Snapshot version bump done ✅'))
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
