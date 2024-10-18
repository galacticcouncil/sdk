import outdent from 'outdent';

export const getReleaseMessage = (releasePlan) => {
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
