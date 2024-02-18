#!/bin/bash

TAGS=$(git tag --points-at HEAD)

for tag in $TAGS; do
  if [[ $tag == *.0 ]]; then
    # Keep major & minor versions (publish)
    continue;
  else
    # Delete patch version
    git tag -d $tag
  fi
done

# Push tags 
git push --follow-tags