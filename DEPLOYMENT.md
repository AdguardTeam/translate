# DEPLOYMENT.md

## Table of Contents

- [Overview](#overview)
- [Publishing Destinations](#publishing-destinations)
  - [npm Registry](#npm-registry)
  - [GitHub Releases](#github-releases)
- [CI/CD Workflows](#cicd-workflows)
  - [Build (`build.yml`)](#build-buildyml)
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

All deployment is automated through a single GitHub Actions workflow. The
only manual step is clicking a button to start the release.

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

### Build (`build.yml`)

Runs on every push to `master`, every PR, and every tag push.

| Trigger | Purpose |
|---|---|
| `push: branches: [master]` | CI gate on merge |
| `pull_request: branches: ['*']` | PR validation |

Steps: **lint → test → build** (via `docker build --target test-output`).

### Release (`release.yml`)

Single, manually triggered workflow that handles the entire release:
tagging, publishing, and notifications.

| Trigger | Purpose |
|---|---|
| `workflow_dispatch` | Manual button (Actions → Release → Run workflow) |
| **No inputs** | Version is read automatically from `package.json` |

Jobs (sequential, each depends on the previous):

| Job | Runner | Purpose |
|---|---|---|
| `tag` | `ubuntu-latest` | Read version, create & push `v<version>` |
| `test` | `team-extensions` | Lint, test, build via Docker |
| `build` | `team-extensions` | Package `translate.tgz` |
| `publish` | `ubuntu-latest` (container: `node:24`) | Verify tag ↔ `package.json`, publish to npm |
| `release` | `ubuntu-latest` | Extract changelog, create GitHub Release draft |
| `notify` | `team-extensions` (shared workflow) | Slack notification |

## Release Process

### Step-by-Step

| # | Who | Action |
|---|-----|--------|
| 1 | Developer | Bump version in `package.json`, update `CHANGELOG.md`, open a PR |
| 2 | Reviewer | Merge the PR into `master` |
| 3 | Developer | Go to **Actions → Release → Run workflow** (no inputs needed) |
| 4 | CI | Tag → lint → test → build → npm publish → GitHub Release draft → Slack |
| 5 | Developer | Review the draft release and click **Publish** |
<!-- markdownlint-disable MD029 -->

### Pipeline Stages

```text
Release (manual button)
     │
     ▼
  tag ──► test ──► build ──► publish ──► release ──► notify
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
`slack-build-notify.yml` workflow.

| Parameter | Value |
|---|---|
| **Channel** | `#adguard-extension-vcs` |
| **Product name** | `@adguard/translate` |
| **Message** | `published to npm` |

Slack notification failures are non-blocking — the release continues even if
Slack is unreachable.

## Troubleshooting

**Release pipeline fails with "Tag version does not match"**

The tag version and `package.json#version` must be identical. The tag is
always created from `package.json`, so this failure typically means the
checkout is stale — ensure the workflow is running from the latest
`master`.

**npm publish fails**

Check that the `extensions` environment is correctly configured in
repository settings and that the npm package has trusted publishing enabled
for `AdGuardSoftwareLimited/ext-translate`.

**GitHub Release draft is empty**

The release notes are extracted from `CHANGELOG.md`. Ensure the heading
matches the version number exactly (e.g. `## 2.0.8` or
`## 2.0.8 - 2026-06-08`). If no matching heading is found, the body
defaults to `"Release v2.0.8"`.
