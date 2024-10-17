import { readFileSync } from 'fs';

import * as git from '@changesets/git';
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

  const releasePlan = readFileSync('../releasePlan.json');
  const releaseMessage = getReleaseMessage(releasePlan);

  await Promise.all(
    releasePlan.releases.map(async ({ name, version }) => {
      const { stdout } = await sh(`npm install ${{ name }}@${{ version }}`);
      console.log(stdout);
    })
  );

  await git.config('user.name', 'GitHub Action');
  await git.config('user.email', 'action@github.com');
  await git.add('package.json', cwd);
  await git.add('package-lock.json', cwd);
  await git.commit(releaseMessage, cwd);
  console.log(releaseMessage);
};

main()
  .then(() => console.log('Release version bump ✅'))
  .catch(console.error)
  .finally(() => process.exit(0));
