#!/bin/bash
set -euo pipefail

VERSION=$1

for pkg_dir in packages/core packages/jest packages/vitest; do
  node -e "
    const fs = require('fs');
    const path = '$pkg_dir/package.json';
    const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
    pkg.version = '$VERSION';
    fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
  "
done
