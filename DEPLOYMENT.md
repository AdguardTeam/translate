# DEPLOYMENT.md

## Table of Contents

- [Overview](#overview)
- [Publishing Destinations](#publishing-destinations)
  - [npm Registry](#npm-registry)
  - [GitHub Releases](#github-releases)
- [CI/CD Workflows](#cicd-workflows)
  - [Create Release PR (`tag.yml`)](#create-release-pr-tagyml)
  - [Tag from Changelog (`tag-from-changelog.yml`)](#tag-from-changelog-tag-from-changelogyml)
  - [Release (`release.yml`)](#release-releaseyml)
- [Release Process](#release-process)
  - [Step-by-Step](#step-by-step)
  - [Pipeline Stages](#pipeline-stages)
- [GitHub Environment](#github-environment)
- [Notifications](#notifications)
- [Troubleshooting](#troubleshooting)

## Overview

`@adguard/translate` is deployed as an **npm package** and a **GitHub
Release**. There is no server, database, or runtime infrastructure — the
library is consumed by other packages via the npm registry.

Deployment is automated through three GitHub Actions workflows. The release
process is triggered by manually creating a release PR, which then auto-tags
and publishes after merge.

## Publishing Destinations

### npm Registry

- **Package name**: `@adguard/translate`
- **Registry**: https://registry.npmjs.org/
- **Visibility**: public
- **Publishing method**: npm trusted publishing (OIDC-based, no tokens)

Trusted publishing links the GitHub Actions environment to the npm package
using OpenID Connect. No npm access token is stored — authentication is
handled automatically by the GitHub runner.

The `provenance` flag (`NPM_CONFIG_PROVENANCE`) is set to `false` because
the package is built from a Docker container rather than directly on the
GitHub runner, which makes the provenance attestation unavailable.

### GitHub Releases

- **Repository**: `AdGuardSoftwareLimited/ext-translate`
- **Format**: draft release, manually published after review
- **Artifact**: `translate.tgz` is attached to each release
- **Release notes**: extracted automatically from `CHANGELOG.md`

## CI/CD Workflows

All workflows live in `.github/workflows/`.

### Create Release PR (`tag.yml`)

Manually triggered workflow that opens a release pull request.

| Trigger | Purpose |
|---|---|
| `workflow_dispatch` | Manual trigger with tag input (e.g., `v2.0.8`) |

Calls the shared `create-release-pr.yml` workflow from
`AdGuardSoftwareLimited/actions` which:

1. Validates the tag and resolves version metadata via `version-metadata.yml`
2. Patches `CHANGELOG.md` — resets `[Unreleased]`, creates a new version
   section with previously-unreleased entries, updates reference links
3. Commits the changelog on a `release-bump/v{version}` branch
4. Opens a PR (attributed to the Octopass app via Octopass token)

**No tags are created by this workflow** — it only opens a PR.

### Tag from Changelog (`tag-from-changelog.yml`)

Automatically triggered when a release PR is merged.

| Trigger | Purpose |
|---|---|
| `pull_request: [closed]` | Fires when a PR is merged |
| Condition: PR merged AND head branch starts with `release-bump/` | Only for release PRs |

Calls the shared `tag-from-changelog.yml` workflow from
`AdGuardSoftwareLimited/actions` which:

1. Parses `CHANGELOG.md` for the latest released version
2. Creates the matching `v{version}` tag on the merge commit

**This tag push triggers `release.yml`.**

### Release (`release.yml`)

Triggered automatically on tag push or manually for re-runs.

| Trigger | Purpose |
|---|---|
| `push: tags: ['v[0-9]+.[0-9]+.[0-9]+*']` | Auto-trigger on tag push |
| `workflow_dispatch` with tag input | Manual re-run of failed release |

Jobs (sequential, each depends on the previous):

| Job | Runner | Purpose |
|---|---|---|
| `meta` | `team-extensions` (shared workflow) | Resolve version metadata from tag |
| `test` | `team-extensions` | Inject version, lint, test, build via Docker |
| `build` | `team-extensions` | Inject version, package `translate.tgz` |
| `publish` | `ubuntu-latest` (container: `node:24`) | Publish to npm via trusted publishing |
| `release` | `team-extensions` | Extract changelog section, create GitHub Release draft |
| `notify` | `team-extensions` (shared action) | Slack notification |

**Version injection**: The source `package.json` has no `version` field.
CI injects the tag-derived version via `npm pkg set version=X` before
building.

## Release Process

### Step-by-Step

| # | Who | Action |
|---|-----|--------|
| 1 | Developer | Go to **Actions → Create Release PR → Run workflow**, enter tag (e.g., `v2.0.8`) |
| 2 | CI | Opens PR: `release-bump/v2.0.8` → `master` with finalized `CHANGELOG.md` |
| 3 | Reviewer | Review the PR body (shows changelog section), approve, merge |
| 4 | CI | `tag-from-changelog.yml` auto-fires, creates tag `v2.0.8` on merge commit |
| 5 | CI | Tag push triggers `release.yml`: inject → lint → test → build → npm publish → GitHub Release draft → Slack |
| 6 | Developer | Review the draft release and click **Publish** |
<!-- markdownlint-disable MD029 -->

### Pipeline Stages

```text
Create Release PR (manual)
     │
     ▼
  PR opens (CHANGELOG finalized)
     │
     ▼
  Merge PR
     │
     ▼
  Auto-tag (from CHANGELOG)
     │
     ▼
  meta → test → build → publish → release → notify
```
<!-- markdownlint-enable MD029 -->

## GitHub Environment

The `publish` job uses the **`extensions`** GitHub environment.

| Setting | Value |
|---|---|
| **Environment name** | `extensions` |
| **Protection rules** | Configured in repository settings |
| **Purpose** | Restricts who can publish to npm |

This environment gates the npm publish step — only workflows that reference
the `extensions` environment can access the OIDC token for trusted
publishing.

## Notifications

Successful releases post to Slack via the shared
`AdGuardSoftwareLimited/actions/actions/slack` action.

| Parameter | Value |
|---|---|
| **Channel** | `#adguard-extension-vcs` |
| **Product name** | `@adguard/translate` |
| **Message** | `published to npm` |

Slack notification failures are non-blocking — the release continues even if
Slack is unreachable.

## Troubleshooting

**Release pipeline fails with "No released version found in CHANGELOG.md"**

The `tag-from-changelog.yml` workflow expects `CHANGELOG.md` to follow
keepachangelog format with bracket version headings (`## [X.Y.Z] - date`).
Ensure the latest version heading matches this format.

**Tag creation fails**

Check that `CHANGELOG.md` has a `## [Unreleased]` section at the top. The
`create-release-pr` workflow requires this to finalize the changelog.

**npm publish fails**

Check that the `extensions` environment is correctly configured in
repository settings and that the npm package has trusted publishing enabled
for `AdGuardSoftwareLimited/ext-translate`.

**GitHub Release draft is empty**

The release notes are extracted from `CHANGELOG.md`. Ensure the heading
matches the version number exactly in bracket format (e.g., `## [2.0.8]`
or `## [2.0.8] - 2026-06-08`). If no matching heading is found, the body
defaults to `"Release v2.0.8"`.

**Re-running a failed release**

If `release.yml` fails after the tag was created, go to
**Actions → Release → Run workflow** and enter the tag (e.g., `v2.0.8`).
This manually triggers the release pipeline without re-creating the tag.
