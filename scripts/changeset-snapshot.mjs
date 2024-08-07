import applyReleasePlan from '@changesets/apply-release-plan';
import getReleasePlan from '@changesets/get-release-plan';

import { read } from '@changesets/config';
import { getPackages } from '@manypkg/get-packages';

import { parseArgs, sh } from './common.mjs';

const getCommitSha = async () => {
  const { stdout } = await sh('git rev-parse --short HEAD');
  return stdout.trim();
};

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
  const commitSha = await getCommitSha();
  const pullRequest = params['pr'];

  if (pullRequest === undefined) {
    throw new Error(
      'Missing --pr configuration. Specify pull request number arg.'
    );
  }

  releasePlan.releases.map((r) => {
    r.newVersion = [r.newVersion, 'pr' + pullRequest, commitSha].join('-');
  });
  await applyReleasePlan(releasePlan, packages, releaseConfig, true);
};

main()
  .then(() => console.log('Snapshot version bump ✅'))
  .catch(console.error)
  .finally(() => process.exit(0));
