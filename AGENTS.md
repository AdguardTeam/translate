# AGENTS.md

## Table Of Contents

- [Project Overview](#project-overview)
- [Technical Context](#technical-context)
- [Project Structure](#project-structure)
- [Build And Test Commands](#build-and-test-commands)
- [Contribution Instructions](#contribution-instructions)
- [Code Guidelines](#code-guidelines)
  - [System Design](#system-design)
  - [Architecture](#architecture)
  - [Code Quality](#code-quality)
  - [Testing](#testing)
  - [Dependency Management](#dependency-management)
  - [Configuration & Documentation](#configuration--documentation)
  - [Markdown Formatting](#markdown-formatting)

## Project Overview

`@adguard/translate` is a TypeScript internationalization (i18n) library that
provides message translation with placeholder substitution, XML tag support,
and plural forms. It includes integrations for React and Preact.

The library targets browser environments but runs in Node.js for testing. It
has zero runtime dependencies — it is fully self-contained.

## Technical Context

| Category | Detail |
|---|---|
| **Language / Version** | TypeScript ~4.1 (strict mode, ES5 target) |
| **Runtime** | Node.js ≥14 (CI: 22.17); browser consumers |
| **Package Manager** | Yarn 1.x (classic) |
| **Build** | Rollup 2.x + Babel 7.x → CJS + ESM + type declarations |
| **Test** | Jest 29.x (`testEnvironment: "node"`, coverage enabled) |
| **Linter** | ESLint 7.x (`@typescript-eslint` plugin) |
| **Docs** | TypeDoc 0.19.x |
| **Primary Dependencies** | None (runtime); React/Preact optional peer |
| **Storage** | N/A |
| **Target Platform** | Browser (library consumed by extensions and web apps) |
| **Project Type** | Library / Package |
| **Performance Goals** | N/A |
| **Constraints** | ES5 output for broad browser compatibility |
| **Scale / Scope** | Consumed by AdGuard browser extensions and products |

## Project Structure

```text
.
├── index.ts                  # Public API entry point (re-exports only)
├── src/
│   ├── Translator.ts         # Core Translator<T> class and I18nInterface
│   ├── translate.ts          # Factory functions (createTranslator, etc.)
│   ├── formatter.ts          # Message formatting: AST → string[]
│   ├── parser.ts             # Message string parser: string → AST
│   ├── nodes.ts              # AST node types and node constructors
│   ├── plural.ts             # Plural rules for ~80 locales + Locale type
│   ├── validator.ts          # Translation structure validation
│   └── plugins/
│       ├── react.ts          # React integration (createReactTranslator)
│       └── preact.ts         # Preact integration (createPreactTranslator)
├── tests/                    # Jest test files mirroring src/ (*.test.ts)
├── dist/                     # Build output (CJS + ESM + type declarations)
├── package.json              # Package manifest and scripts
├── tsconfig.json             # TypeScript configuration
├── rollup.config.js          # Rollup build configuration
├── babel.config.js           # Babel transpilation configuration
├── jest.config.ts            # Jest test configuration
├── .eslintrc.js              # ESLint configuration
├── .github/
│   └── workflows/
│       ├── prepare-release.yml   # Release PR creation (create-release-pr)
│       ├── publish-release.yml   # Auto-tag + release pipeline (tag, build, publish)
│       └── build.yml             # CI build and test on PRs
├── Dockerfile                # Multi-stage CI build pipeline
├── README.md                 # Library documentation and usage examples
├── CHANGELOG.md              # Release history
└── DEVELOPMENT.md            # Local development setup guide
```

## Build And Test Commands

| Command | Description |
|---|---|
| `yarn build` | Build CJS + ESM + type declarations via Rollup |
| `yarn test` | Run Jest test suite with coverage |
| `yarn lint` | Run ESLint on `src/` and `tests/` |
| `yarn version:current` | Show current version from latest git tag |
| `yarn docs` | Generate TypeDoc documentation in `docs/` |

## Contribution Instructions

- You MUST verify your changes with the linter and type checker:

  ```bash
  yarn lint
  yarn build
  ```

  `yarn build` also performs type checking via the TypeScript compiler
  (Rollup uses the TypeScript plugin). The project has no separate formatter
  or type-check command.

- You MUST update the unit tests for changed code.

- You MUST run tests to verify that your changes do not break existing
  functionality:

  ```bash
  yarn test
  ```

- When making changes to the project structure, ensure the Project Structure
  section in `AGENTS.md` is updated and remains valid.

- When modifying CI workflows, ensure `prepare-release.yml` and
  `publish-release.yml` stay in sync. The version is derived from git
  tags (not `package.json`).

- Never change `package.json` version manually — it is `0.0.0` in source and
  injected during CI from the git tag.

- If the prompt essentially asks you to refactor or improve existing code,
  check if you can phrase it as a code guideline. If it is possible, add it
  to the relevant Code Guidelines section in `AGENTS.md`.

- After completing the task you MUST verify that the code you have written
  follows the Code Guidelines in this file.

- After completing the task you MUST verify that the code you have written
  follows the Code Guidelines in this file.

## Code Guidelines

### System Design

Design for a library:

- The library is consumed by other code — never access the filesystem,
  network, or environment unless the caller explicitly opts in. Keep side
  effects out of the default code path.
- Export a stable public API; internal functions and types MUST be
  explicitly kept out of `index.ts`. Internal modules (`parser`, `formatter`,
  `nodes`) are not exported from the public API.
- Keep the dependency footprint minimal — every transitive dependency
  becomes a burden on consumers. This library has zero runtime dependencies.
- Do not mutate global state (environment variables, process listeners,
  shared singletons) — the consumer may use the library in a long-running
  process alongside other code.
- Provide complete type definitions so the library is usable with static
  type checking and editor autocompletion out of the box. Type declarations
  are emitted as part of the build.
- Document every public function, class, and type with doc comments —
  consumers should not need to read source code to use the library.
- Handle errors by throwing specific, documented `Error` objects — let the
  consumer decide how to recover. Do not silently swallow errors.

### Architecture

Universal design principles:

- **Separation of Concerns** — each module handles one aspect of the system
  (parsing, formatting, plural logic, validation).
- **Single Responsibility Principle** — every file has one reason to change
  (e.g., `parser.ts` only parses strings into AST nodes).
- **Dependency Direction** — dependencies point downward; higher-level
  modules import lower-level ones, never the reverse.
- **Explicit Boundaries** — internal modules (`parser`, `formatter`, `nodes`)
  are not reachable from the public API.
- **Data Flow Clarity** — data moves predictably: message string → AST nodes
  → formatted output.
- **Minimize Coupling, Maximize Cohesion** — modules interact through narrow,
  well-defined interfaces.
- **Make Invalid States Impossible** — TypeScript strict mode and explicit
  types prevent illegal states at compile time. Runtime guards exist for
  JavaScript consumers.
- **Observability Built-in** — errors include descriptive messages with the
  relevant key or locale. This is less critical for a library (callers
  handle logging), but error messages must be actionable.
- **Keep It Boring** — no clever patterns; the codebase uses a
  straightforward layered architecture.

Layered architecture:

| Layer | Responsibility | Examples |
|---|---|---|
| **AST / Types** | Message node type definitions | `src/nodes.ts` |
| **Plural Rules** | Locale-specific plural form logic | `src/plural.ts` |
| **Parser** | Message string → AST | `src/parser.ts` |
| **Formatter** | AST → rendered output | `src/formatter.ts` |
| **Translator** | Core i18n orchestration | `src/Translator.ts` |
<!-- markdownlint-disable MD013 -->
| **Factory / Plugins** | Convenience constructors; framework integrations | `src/translate.ts`, `src/plugins/react.ts`, `src/plugins/preact.ts` |
<!-- markdownlint-enable MD013 -->
| **Validation** | Cross-cutting translation validation | `src/validator.ts` |

Dependency flow:

```text
index.ts (public API)
  ├── src/translate.ts (factory layer)
  │     ├── src/plugins/react.ts
  │     │     └── src/Translator.ts
  │     ├── src/plugins/preact.ts
  │     │     └── src/Translator.ts
  │     └── src/Translator.ts
  ├── src/Translator.ts (core)
  │     ├── src/formatter.ts
  │     │     ├── src/parser.ts
  │     │     └── src/nodes.ts
  │     └── src/plural.ts
  └── src/validator.ts
        ├── src/parser.ts
        ├── src/nodes.ts
        └── src/plural.ts
```

All dependencies flow downward. There are no circular dependencies.

### Code Quality

**TypeScript:**

- Strict mode is enabled (`strict: true` in `tsconfig.json`).
- `noImplicitAny: true` — all parameters must have explicit types.
- Target: ES5 for maximum browser compatibility.
- Module format: ES2015 for tree-shaking; output as both CJS and ESM via
  Rollup.
- Avoid `any` — use `// eslint-disable-next-line @typescript-eslint/no-explicit-any`
  only when absolutely necessary.

**Static analysis gates:**

- ESLint (`eslint:recommended` + `@typescript-eslint/recommended`) on
  `src/` and `tests/`.
- TypeScript compiler (`tsc`) via Rollup plugin during build.
- No separate formatter is configured — ESLint handles both linting and
  style.
- Do not modify ESLint rules without a documented reason.

**Naming:**

- Use PascalCase for classes and interfaces (e.g., `Translator`,
  `I18nInterface`, `MessageConstructorInterface`).
- Use camelCase for functions and variables (e.g., `getMessage`,
  `createTranslator`, `isTranslationValid`).
- Interfaces may use the `Interface` suffix or `I` prefix as established
  in the existing codebase.
- Generic type parameter `T` for the message return type.
- Enum names: PascalCase (e.g., `AvailableLocales`, `STATE`).
- File names: camelCase (e.g., `formatter.ts`, `nodes.ts`).

**Error handling:**

- Throw descriptive `Error` objects with messages that include the
  relevant key or locale.
- Do not silently swallow errors — missing translation keys should throw.
- Lower-level modules (parser, formatter) throw; higher-level modules
  (validator) may catch and convert to boolean returns.
- `isPluralFormValid` returns `boolean`; `isTranslationValid` throws on
  structurally invalid input. Be consistent with existing patterns.

**Imports / exports:**

- The public API is defined in `index.ts` — only export what consumers
  need.
- Internal modules (`parser`, `nodes`, `formatter`) are not exported
  directly.
- The `dist/` folder is the published artifact (specified in `package.json`
  `files`).
- `ValuesAny` type is defined in `formatter.ts` and re-exported where
  needed — prefer defining shared types in a single location.

**Documentation:**

- Public functions, classes, and types must have JSDoc comments.
- The `README.md` contains library usage documentation and API reference.
- `DEVELOPMENT.md` contains local development setup instructions.

### Testing

- Tests live in `tests/` mirroring the `src/` structure (e.g.,
  `tests/formatter.test.ts` for `src/formatter.ts`).
- Use Jest with `testEnvironment: "node"` and `collectCoverage: true`.
- No mocking framework — use inline fake objects for `I18nInterface`
  implementations.
- Test both valid and invalid inputs (missing keys, wrong plural forms,
  malformed tags, edge cases).
- Use `describe` blocks for categorized scenarios.
- Use `test.each` for table-driven tests where appropriate.
- Verify error paths with both `toThrow()` and `toBeFalsy()` patterns.

### Dependency Management

- **Pin all dependency versions exactly** — use exact versions, not ranges
  with `^` or `~`. The current `devDependencies` use caret ranges; prefer
  exact versions when adding new dependencies.
- **Prefer vanilla solutions** — this library has zero runtime dependencies
  by design. Use the language's standard library and built-in APIs.
- **Reputable sources only** — dependencies MUST come from well-established,
  actively maintained projects (e.g., TypeScript, Jest, Rollup, ESLint).
- **Avoid unpopular libraries** — do NOT add niche or obscure packages.
- **Minimize dependency count** — each new dependency increases attack
  surface and maintenance burden. Justify every addition.
- **Use the latest stable version** — when adding a new dependency,
  explicitly check the npm registry for the latest stable release.

**Rationale**: Fewer, well-vetted dependencies reduce security
vulnerabilities, supply chain risks, and long-term maintenance costs.

**Known exclusions** (to be fixed):

- `devDependencies` use `^` (caret) version ranges instead of exact
  versions. These should be pinned to exact versions to ensure reproducible
  builds.

### Configuration & Documentation

- Runtime configuration is provided by the consumer through the
  `I18nInterface` implementation — the library has no config files or
  environment variables.
- Build configuration lives in `rollup.config.js`, `babel.config.js`,
  `tsconfig.json`, and `jest.config.ts`.
- When changing build commands or project structure, update `AGENTS.md`
  (Project Structure and Build And Test Commands sections), `README.md`
  (if public API changes), and `DEVELOPMENT.md` (if local setup changes).
- When modifying CI workflows, ensure `prepare-release.yml` and
  `publish-release.yml` stay in sync. The version is derived from git
  tags (not `package.json`).
- The library has no secrets or hardcoded values — all locale-specific
  logic is in `src/plural.ts` and is statically defined.

### Releases & CI/CD

- **Version source**: The version is derived from git tags, not
  `package.json`. The source `package.json` always has `"version": "0.0.0"`.
- **Release flow**: The release process follows two steps:
    1. **Create release PR** — Trigger `prepare-release.yml` via
       `workflow_dispatch` with the desired tag (e.g. `v2.0.8`). This
       calls `create-release-pr` which finalizes the `[Unreleased]`
       section in `CHANGELOG.md` and opens a PR.
    2. **Merge the PR** — Review and merge the release PR. The
       `publish-release.yml` workflow triggers automatically on merge,
       reads the latest version from `CHANGELOG.md`, creates the
       matching `v{version}` tag on the merge commit, builds, tests,
       publishes to npm, creates a GitHub Release draft, and sends a
       Slack notification.
- **Manual release**: `publish-release.yml` can also be triggered
  manually via `workflow_dispatch` with a ref input (useful for
  re-running a failed release).
- **Version injection**: CI injects the tag version into `package.json`
  via `npm pkg set version=X` before building, so the published npm
  package has the correct version.
- **No manual version bumps**: Never change `package.json` version by hand.
  Use the `Create Release PR` workflow to start a release.
- **Use `yarn version:current`**: To see the current version from the
  latest tag, run `yarn version:current` (which runs
  `git describe --tags --abbrev=0`).
- **Changelog format**: `CHANGELOG.md` follows
  [Keep a Changelog](https://keepachangelog.com/) with version headings
  in bracket format (`## [X.Y.Z] - YYYY-MM-DD`). The `[Unreleased]`
  section collects pending changes between releases.

### Markdown Formatting

All Markdown files MUST follow these formatting rules:

- **Line length**: Keep lines at most 80 characters, but do not wrap
  lines artificially short just to hit the limit. Lines inside fenced
  code blocks are exempt from this limit.
- **Unordered lists**: Use dashes (`-`) for bullet points. Indent nested
  list items by 4 spaces.
- **Continuation lines**: When a list item wraps to the next line, align
  the continuation with the first character of the item text, not the
  list marker.
- **Emphasis**: Use asterisks (`*`) for emphasis (`*italic*`, `**bold**`).
  Do NOT use underscores.
- **Headings**: Duplicate heading names are allowed only among sibling
  headings (same parent level). Avoid duplicates across different levels.
- **Inline HTML**: Avoid raw HTML in Markdown. The only allowed elements
  are `<a>`, `<p>`, `<details>`, `<summary>`, and `<img>`.
- **Trailing spaces**: Do NOT leave trailing whitespace on any line. Do
  NOT use two-space line breaks — use a blank line instead.
- **Bare URLs**: Bare URLs are permitted and do not need to be wrapped in
  angle brackets.
- **Table formatting**: Align table columns with padding when the table
  fits within 80 characters. If the table exceeds 80 characters, switch
  to a compact format using single spaces only.

**Rationale**: Uniform Markdown formatting improves readability for both
humans and AI agents that consume project documentation.

