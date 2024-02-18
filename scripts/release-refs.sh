#!/bin/bash

TAGS=$(git tag --points-at HEAD)

for tag in $TAGS; do
  if [[ $tag == *.0 ]]; then
    # Keep only major & minor versions
    continue;
  else
    # Delete patch version
    git tag -d $tag
  fi
done

# Push all the refs with annotated local tags
git push --follow-tags