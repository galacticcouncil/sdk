import getReleasePlan from '@changesets/get-release-plan';
import applyReleasePlan from '@changesets/apply-release-plan';
import { read } from '@changesets/config';
import * as git from '@changesets/git';
import { getPackages } from '@manypkg/get-packages';

import { sh } from './common.mjs';
import { getReleaseMessage } from './changeset-utils.mjs';

const main = async () => {
  const cwd = process.cwd();
  const packages = await getPackages(cwd);
  const config = await read(cwd, packages);
  const releasePlan = await getReleasePlan(cwd, undefined);
  await applyReleasePlan(releasePlan, packages, config, false);
  const { stdout } = await sh('npm i --package-lock-only');
  console.log(stdout);
  const releaseMessage = getReleaseMessage(releasePlan);
  await git.add('.', cwd);
  await git.commit(releaseMessage, cwd);
  console.log(releaseMessage);
};

main()
  .then(() => console.log('Release version bump ✅'))
  .catch(console.error)
  .finally(() => process.exit(0));
