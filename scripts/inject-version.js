#!/usr/bin/env node
/**
 * Inject version into package.json.
 *
 * Usage: node scripts/inject-version.js <version>
 * Example: node scripts/inject-version.js 2.0.8
 *
 * Called from CI workflows to write the tag-derived version into
 * package.json before Docker-based builds. The source package.json
 * has no "version" field — the real version is only injected during
 * CI from the git tag.
 */

const fs = require('fs');
const path = require('path');

const version = process.argv[2];
if (!version) {
  console.error('Usage: node scripts/inject-version.js <version>');
  process.exit(1);
}

const pkgPath = path.resolve(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.version = version;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

console.log('Injected version:', pkg.version);
