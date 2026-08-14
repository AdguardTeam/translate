# DEVELOPMENT.md

## Table of Contents

- [Prerequisites](#prerequisites)
  - [Required Tools](#required-tools)
  - [Recommended Tools](#recommended-tools)
- [Getting Started](#getting-started)
  - [Clone the Repository](#clone-the-repository)
  - [Install Dependencies](#install-dependencies)
  - [Verify the Setup](#verify-the-setup)
- [Development Workflow](#development-workflow)
  - [Branching Strategy](#branching-strategy)
  - [Code Style](#code-style)
  - [Running Tests](#running-tests)
  - [Building](#building)
  - [Generating Documentation](#generating-documentation)
- [Common Tasks](#common-tasks)
  - [Adding a New Locale](#adding-a-new-locale)
  - [Adding a Plugin (Framework Integration)](#adding-a-plugin-framework-integration)
  - [Bumping the Version](#bumping-the-version)
  - [Running the Full CI Pipeline Locally](#running-the-full-ci-pipeline-locally)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)
  - [Build Fails with Type Errors](#build-fails-with-type-errors)
  - [Tests Fail After Dependency Changes](#tests-fail-after-dependency-changes)
  - [ESLint Errors](#eslint-errors)
- [Additional Resources](#additional-resources)

## Prerequisites

### Required Tools

<!-- markdownlint-disable MD013 -->
| Tool | Minimum Version | How to Check |
|---|---|---|
| **Node.js** | >=22 | `node --version` |
| **pnpm** | 10.x (>=10.33.4 <11) | `pnpm --version` |
<!-- markdownlint-enable MD013 -->

<!-- markdownlint-disable MD013 -->
This project uses **pnpm** as its package manager. Make sure you are running
pnpm 10.x (>=10.33.4 <11):
<!-- markdownlint-enable MD013 -->

```bash
pnpm --version
# Expected output: 10.x.x
```

If you need to install pnpm (e.g. via Corepack):

```bash
corepack enable
```

or with npm:

```bash
npm install -g pnpm@10
```

### Recommended Tools

- **VS Code** with the following extensions:
  - ESLint (`dbaeumer.vscode-eslint`) — inline linting
  - Jest (`Orta.vscode-jest`) — inline test runner
- **Docker** (optional) — for running the CI pipeline locally

## Getting Started

### Clone the Repository

```bash
git clone git@github.com:AdGuardSoftwareLimited/ext-translate.git
cd ext-translate
```

### Install Dependencies

```bash
pnpm install
```

This installs all dev dependencies (TypeScript, Rollup, Jest, ESLint, etc.).
There are no runtime dependencies — the library is self-contained.
Dev dependencies are pinned to exact versions for reproducible installs;
see [AGENTS.md](./AGENTS.md) "Dependency Management" for the full policy.

### Verify the Setup

Run the full check suite to confirm everything works:

```bash
pnpm lint && pnpm test && pnpm build
```

All three commands should pass without errors.

## Development Workflow

### Branching Strategy

1. Create a feature branch from `master`:

   ```bash
   git checkout master
   git pull origin master
   git checkout -b AG-XXXX-short-description
   ```

2. Make changes and commit using ticket-prefixed commit messages (see
   [Commit Message Convention](#commit-message-convention)).

3. Before pushing, run the full check suite:

   ```bash
   pnpm lint && pnpm test && pnpm build
   ```

4. Push your branch and open a pull request against `master`.

### Commit Message Convention

Every commit message MUST start with the ticket number (`AG-XXX`) so it
auto-links with the task tracker, followed by a short description in the
present tense:

```text
AG-XXX <short description in present tense>
```

Examples:

- `AG-57528 Migrate package manager to pnpm`
- `AG-4321 Fix redirect after login`
- `AG-99 Update dependencies`

Automated commits that CI creates on its own (for example, the CHANGELOG
finalization in the release PRs, which has no ticket number) use a
[Conventional Commits] prefix such as `docs:` — e.g.
`docs: finalize changelog for release`.

### Changelog Scope

Do NOT add a `CHANGELOG.md` `[Unreleased]` entry for changes that only
affect CI, tooling, or tests. `[Unreleased]` records user-facing changes
only — any change a consumer would observe (public API, behavior, build
output, dependencies). A package-manager migration, CI plumbing, or
internal refactor with no user-visible effect does not get a changelog
entry.

### Code Style

Code style is enforced by ESLint with the TypeScript plugin.
The configuration is in `.eslintrc.js`:

- Parser: `@typescript-eslint/parser`
- Extends: `eslint:recommended` and
  `plugin:@typescript-eslint/recommended`

Run the linter:

```bash
pnpm lint
```

The linter checks all files in `src/` and `tests/`. There is no auto-fix
configuration — fix issues manually.

For code guidelines and naming conventions, see
[AGENTS.md](./AGENTS.md).

### Running Tests

Tests are written with Jest and live in the `tests/` directory.

Run all tests:

```bash
pnpm test
```

This also collects code coverage into the `coverage/` directory.

Run a single test file:

```bash
pnpm exec jest tests/validator.test.ts
```

Run tests in watch mode (reruns on file changes):

```bash
pnpm exec jest --watch
```

Jest configuration is in `jest.config.ts`:

- Environment: `node`
- Coverage: enabled, output to `coverage/`

### Building

<!-- markdownlint-disable MD013 -->
| Output | Path | Format |
|---|---|---|
| CJS bundle | `dist/index.js` | CommonJS |
| ESM bundle | `dist/index.esm.js` | ES Module |
| Type declarations | `dist/types/index.d.ts` | TypeScript declarations |
<!-- markdownlint-enable MD013 -->

Run the build:

```bash
pnpm build
```

The build uses Rollup with the following plugins:

- `@wessberg/rollup-plugin-ts` — TypeScript compilation via Babel
- `@rollup/plugin-commonjs` — CommonJS module resolution
- `@rollup/plugin-node-resolve` — Node module resolution

The TypeScript compilation transpiles to ES5 for maximum browser
compatibility.

### Generating Documentation

API documentation is generated with TypeDoc:

```bash
pnpm docs
```

Output is written to `docs/`. Open `docs/index.html` in a browser to view it.

## Common Tasks

### Adding a New Locale

<!-- markdownlint-disable MD013 MD029 -->
1. Add the locale code to the `Locale` type in `src/plural.ts`.
2. Add the locale's plural rules to the `PLURALS` map in the same file.
3. Add a test case in `tests/validator.test.ts` or `tests/translate.test.ts` to verify the new locale's plural forms.
<!-- markdownlint-enable MD013 MD029 -->

### Adding a Plugin (Framework Integration)

<!-- markdownlint-disable MD013 MD029 -->
1. Create a new file in `src/plugins/` (e.g., `src/plugins/vue.ts`).
2. Implement a factory function following the pattern in `src/plugins/react.ts` — it should call `createTranslator` with an appropriate `messageConstructor`.
3. Export the factory from `src/translate.ts`.
4. Add the export to `index.ts`.
5. Add a test in `tests/translate.test.ts`.
<!-- markdownlint-enable MD013 MD029 -->

### Bumping the Version

<!-- markdownlint-disable MD013 -->
Do not change the `version` in `package.json` — the source manifest has no
version field. CI stamps a next-patch `-dev` version
(e.g. `2.0.8` → `2.0.9-dev`) into `package.json` before the Docker build
using the shared `set-dev-version` action
(`AdGuardSoftwareLimited/ext-shared-actions/.github/actions/set-dev-version@master`),
and the real tag version is injected at release time.
<!-- markdownlint-enable MD013 -->

To see the current version, use `git describe --tags --abbrev=0`.

Create a release via the release PR workflow (see AGENTS.md "Releases &
CI/CD").

### Running the Full CI Pipeline Locally

The `Dockerfile` defines a multi-stage BuildKit pipeline. To run it locally:

```bash
DOCKER_BUILDKIT=1 docker build --target test-output --output out .
```

If the pipeline passes, `out/test-passed.txt` will be created.

To produce the release artifact:

```bash
DOCKER_BUILDKIT=1 docker build --target build-output --output out .
```

The artifact `translate.tgz` will be in the `out/` directory.

Note: `pnpm pack` requires a version in `package.json`. In CI the shared
`set-dev-version` action stamps the version before the Docker build; to run
the `build-output` target locally, stamp the version first (e.g.
`npm pkg set version="0.0.0"`).

## Project Structure

```text
.
<!-- markdownlint-disable MD013 -->
├── index.ts                  # Public API: re-exports Translator, translate, validator, Locale
<!-- markdownlint-enable MD013 -->
├── src/
│   ├── Translator.ts         # Core Translator class with getMessage() and getPlural()
<!-- markdownlint-disable MD013 -->
│   ├── translate.ts          # Factory functions: createTranslator, createReactTranslator, createPreactTranslator
<!-- markdownlint-enable MD013 -->
<!-- markdownlint-disable MD013 -->
│   ├── formatter.ts          # Formats messages with placeholder substitution and tag processing
<!-- markdownlint-enable MD013 -->
<!-- markdownlint-disable MD013 -->
│   ├── parser.ts             # Parses message strings into AST nodes
<!-- markdownlint-enable MD013 -->
│   ├── nodes.ts              # AST node type definitions
│   ├── plural.ts             # Locale type, plural form selection logic
│   ├── validator.ts          # Translation validation: isTranslationValid, isPluralFormValid
│   └── plugins/
│       ├── react.ts          # createReactTranslator — returns React elements
│       └── preact.ts         # createPreactTranslator — returns Preact elements
├── tests/                    # Jest test files mirroring src/ structure
├── dist/                     # Build output (gitignored)
│   ├── index.js              # CJS bundle
│   ├── index.esm.js          # ESM bundle
│   └── types/                # TypeScript declarations
├── package.json
├── tsconfig.json             # TypeScript configuration (target: ES5, strict: true)
├── rollup.config.js          # Rollup build configuration
├── babel.config.js           # Babel configuration (preset-env + preset-typescript)
├── jest.config.ts            # Jest configuration
├── .eslintrc.js              # ESLint configuration
├── Dockerfile                # Multi-stage CI/CD pipeline
├── README.md                 # User-facing documentation
├── AGENTS.md                 # Code guidelines for contributors
├── CHANGELOG.md              # Release history
└── DEVELOPMENT.md            # This file
```

## Troubleshooting

### Build Fails with Type Errors

1. Run `pnpm lint` first — many type errors are caught by ESLint.
2. Check that you're on a compatible Node.js version:
   `node --version` (>=22 required).
3. Clear caches and rebuild:

   ```bash
   rm -rf dist node_modules
   pnpm install
   pnpm build
   ```

### Tests Fail After Dependency Changes

1. Clear Jest's cache:

   ```bash
   pnpm exec jest --clearCache
   ```

2. Reinstall dependencies and retry:

   ```bash
   rm -rf node_modules
   pnpm install
   pnpm test
   ```

### ESLint Errors

<!-- markdownlint-disable MD013 -->
- ESLint configuration extends
  `plugin:@typescript-eslint/recommended`, which enforces strict
  TypeScript rules.
- If you encounter `no-explicit-any`, use
  `// eslint-disable-next-line @typescript-eslint/no-explicit-any`
  only when `any` is truly unavoidable (e.g., generic constraints in
  the constructor).
<!-- markdownlint-enable MD013 -->
- The linter does not auto-fix — resolve each issue manually.

## Additional Resources

<!-- markdownlint-disable MD013 -->
- [README.md](./README.md) — User-facing documentation and API reference
- [AGENTS.md](./AGENTS.md) — Code guidelines for LLM agents and contributors
- [CHANGELOG.md](./CHANGELOG.md) — Release history
- [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) — Changelog format used by this project
- [Semantic Versioning](https://semver.org/spec/v2.0.0.html) — Versioning scheme
- [Plural Forms Reference](https://github.com/translate/l10n-guide/blob/master/docs/l10n/pluralforms.rst) — Unicode CLDR plural rules
<!-- markdownlint-enable MD013 -->

[Conventional Commits]: https://www.conventionalcommits.org/en/v1.0.0/
