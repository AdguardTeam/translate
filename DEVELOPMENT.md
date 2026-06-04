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

| Tool | Minimum Version | How to Check |
|---|---|---|
| **Node.js** | 10.x (CI uses 22.17) | `node --version` |
| **Yarn** | 1.x (classic) | `yarn --version` |

This project uses **Yarn Classic** as its package manager. Yarn 2+ (Berry) is not supported — make sure you are running Yarn 1.x:

```bash
yarn --version
# Expected output: 1.x.x
```

If you need to install Yarn 1.x:

```bash
npm install -g yarn
```

### Recommended Tools

- **VS Code** with the following extensions:
  - ESLint (`dbaeumer.vscode-eslint`) — inline linting
  - Jest (`Orta.vscode-jest`) — inline test runner
- **Docker** (optional) — for running the CI pipeline locally

## Getting Started

### Clone the Repository

```bash
git clone git@github.com:AdGuardSoftwareLimited/translate.git
cd translate
```

### Install Dependencies

```bash
yarn install
```

This installs all dev dependencies (TypeScript, Rollup, Jest, ESLint, etc.). There are no runtime dependencies — the library is self-contained.

### Verify the Setup

Run the full check suite to confirm everything works:

```bash
yarn lint && yarn test && yarn build
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

2. Make changes and commit using conventional commit messages.

3. Before pushing, run the full check suite:
   ```bash
   yarn lint && yarn test && yarn build
   ```

4. Push your branch and open a pull request against `master`.

### Code Style

Code style is enforced by ESLint with the TypeScript plugin. The configuration is in `.eslintrc.js`:

- Parser: `@typescript-eslint/parser`
- Extends: `eslint:recommended` and `plugin:@typescript-eslint/recommended`

Run the linter:

```bash
yarn lint
```

The linter checks all files in `src/` and `tests/`. There is no auto-fix configuration — fix issues manually.

For code guidelines and naming conventions, see [AGENTS.md](./AGENTS.md).

### Running Tests

Tests are written with Jest and live in the `tests/` directory.

Run all tests:

```bash
yarn test
```

This also collects code coverage into the `coverage/` directory.

Run a single test file:

```bash
npx jest tests/validator.test.ts
```

Run tests in watch mode (reruns on file changes):

```bash
npx jest --watch
```

Jest configuration is in `jest.config.ts`:
- Environment: `node`
- Coverage: enabled, output to `coverage/`

### Building

The build produces three outputs in `dist/`:

| Output | Path | Format |
|---|---|---|
| CJS bundle | `dist/index.js` | CommonJS |
| ESM bundle | `dist/index.esm.js` | ES Module |
| Type declarations | `dist/types/index.d.ts` | TypeScript declarations |

Run the build:

```bash
yarn build
```

The build uses Rollup with the following plugins:
- `@wessberg/rollup-plugin-ts` — TypeScript compilation via Babel
- `@rollup/plugin-commonjs` — CommonJS module resolution
- `@rollup/plugin-node-resolve` — Node module resolution

The TypeScript compilation transpiles to ES5 for maximum browser compatibility.

### Generating Documentation

API documentation is generated with TypeDoc:

```bash
yarn docs
```

Output is written to `docs/`. Open `docs/index.html` in a browser to view it.

## Common Tasks

### Adding a New Locale

1. Add the locale code to the `Locale` type in `src/plural.ts`.
2. Add the locale's plural rules to the `PLURALS` map in the same file.
3. Add a test case in `tests/validator.test.ts` or `tests/translate.test.ts` to verify the new locale's plural forms.

### Adding a Plugin (Framework Integration)

1. Create a new file in `src/plugins/` (e.g., `src/plugins/vue.ts`).
2. Implement a factory function following the pattern in `src/plugins/react.ts` — it should call `createTranslator` with an appropriate `messageConstructor`.
3. Export the factory from `src/translate.ts`.
4. Add the export to `index.ts`.
5. Add a test in `tests/translate.test.ts`.

### Bumping the Version

```bash
yarn increment
```

This bumps the patch version in `package.json` without creating a git tag. For minor or major version bumps, update `package.json` manually.

After bumping, add an entry to `CHANGELOG.md` following the [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format.

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

## Project Structure

```
.
├── index.ts                  # Public API: re-exports Translator, translate, validator, Locale
├── src/
│   ├── Translator.ts         # Core Translator class with getMessage() and getPlural()
│   ├── translate.ts          # Factory functions: createTranslator, createReactTranslator, createPreactTranslator
│   ├── formatter.ts          # Formats messages with placeholder substitution and tag processing
│   ├── parser.ts             # Parses message strings into AST nodes
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

1. Run `yarn lint` first — many type errors are caught by ESLint.
2. Check that you're on a compatible Node.js version: `node --version` (≥10 required).
3. Clear caches and rebuild:
   ```bash
   rm -rf dist node_modules
   yarn install
   yarn build
   ```

### Tests Fail After Dependency Changes

1. Clear Jest's cache:
   ```bash
   npx jest --clearCache
   ```
2. Reinstall dependencies and retry:
   ```bash
   rm -rf node_modules
   yarn install
   yarn test
   ```

### ESLint Errors

- ESLint configuration extends `plugin:@typescript-eslint/recommended`, which enforces strict TypeScript rules.
- If you encounter `no-explicit-any`, use `// eslint-disable-next-line @typescript-eslint/no-explicit-any` only when `any` is truly unavoidable (e.g., generic constraints in the constructor).
- The linter does not auto-fix — resolve each issue manually.

## Additional Resources

- [README.md](./README.md) — User-facing documentation and API reference
- [AGENTS.md](./AGENTS.md) — Code guidelines for LLM agents and contributors
- [CHANGELOG.md](./CHANGELOG.md) — Release history
- [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) — Changelog format used by this project
- [Semantic Versioning](https://semver.org/spec/v2.0.0.html) — Versioning scheme
- [Plural Forms Reference](https://github.com/translate/l10n-guide/blob/master/docs/l10n/pluralforms.rst) — Unicode CLDR plural rules
