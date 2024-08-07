import getReleasePlan from '@changesets/get-release-plan';
import applyReleasePlan from '@changesets/apply-release-plan';
import { read } from '@changesets/config';
import * as git from '@changesets/git';
import { getPackages } from '@manypkg/get-packages';
import outdent from 'outdent';

import { sh } from './common.mjs';

const getReleaseMessage = (releasePlan) => {
  const releases = releasePlan.releases.filter(
    (release) => release.type !== 'none'
  );
  const releasesLines = releases
    .map((release) => `  ${release.name}@${release.newVersion}`)
    .join('\n');
  const releaseMessage = outdent`
    RELEASE: Releasing ${releases.length} package(s)
  
    Releases:
    ${releasesLines}
  `;
  return releaseMessage;
};

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
