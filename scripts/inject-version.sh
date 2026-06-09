#!/usr/bin/env bash
# Inject version into package.json.
#
# Usage: ./scripts/inject-version.sh <version>
# Example: ./scripts/inject-version.sh 2.0.8
#
# Called from CI workflows to write the tag-derived version into
# package.json before Docker-based builds. The source package.json
# always has "version": "0.0.0" — the real version is only injected
# during CI from the git tag.

set -euo pipefail

VERSION="${1:?Usage: $0 <version>}"

node -e "
  const fs = require('fs');
  const p = JSON.parse(fs.readFileSync('package.json'));
  p.version = '$VERSION';
  fs.writeFileSync('package.json', JSON.stringify(p, null, 2) + '\n');
"

echo "Injected version: $(node -p "require('./package.json').version")"
