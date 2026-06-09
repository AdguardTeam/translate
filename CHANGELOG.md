# Translate Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [Unreleased]

### Fixed

- Missing files in npm package.


## 2.0.6 - 2026-06-04

### Changed

- Repository URL updated.


## 2.0.1 - 2025-12-12

### Changed

- [BREAKING CHANGE] Single '%' signs are not allowed anymore and should be
  escaped by extra percent sign '%%'.

### Added

- Error throwing on unsupported locale passed to `isTranslationValid()` and
  `isPluralFormValid()`.

### Fixed

- More specific error logging of `getMessage()` and `getPluralForm()`.


## 1.0.2 - 2023-09-26

### Changed

- Improved `isTranslationValid()` and `isPluralFormValid()` methods.


## 0.3.2 - 2023-08-23

### Added

- Support for `sr_latn` locale.


## 0.3.1 - 2023-08-23

### Added

- `Locales` type exported for consumers to use in type annotations.


## 0.3.0 - 2022-05-19

### Fixed

- Plural form bugs for `fr`, `zh_tw`, `zh_cn`, `pt_br`, and `pt_pt` locales.

### Added

- `getMessage()` now falls back to the base locale translation on error
  instead of throwing for missing keys.


## 0.2.6 - 2022-01-19

### Added

- Preact integration via `createPreactTranslator()`.


## 0.2.5 - 2021-10-06

### Added

- `Translator` class exported for programmatic use in other libraries.


## 0.2.4 - 2021-09-06

### Changed

- Improved parser error logging for malformed translation strings.


## 0.2.3 - 2021-06-16

### Added

- Default HTML tags (`<b>`, `<p>`, `<strong>`, `<tt>`, `<s>`, `<i>`) are now
  automatically expanded in React translator without requiring them to be
  passed in `values`.


## 0.2.2 - 2021-03-09

### Added

- Tag attribute validation: parser throws an error if XML tags contain
  attributes, preventing silent misrendering.


## 0.2.1 - 2021-02-02

### Added

- `number` parameter is now automatically appended to the params object in
  `getPlural()`, making it available for placeholder substitution in plural
  forms.


## 0.2.0 - 2021-01-19

### Added

- Plural string support with locale-specific plural forms for ~80 locales.
- `getPlural()` method on Translator for retrieving correct plural forms.

### Changed

- `getMessage()` signature updated to support tag converters and placeholder
  substitution via `params`.


## 0.1.0 - 2021-01-14

### Added

- Initial release extracted from the AdGuard browser extension codebase.
- Core i18n translation with placeholder (`%name%`) and XML tag (`<a>...</a>`)
  support.
- React integration via `createReactTranslator()`.
- Translation validation via `isTranslationValid()` and
  `isPluralFormValid()`.
- `Translator<T>` class with typed message constructor for framework-specific
  output.


[unreleased]: https://github.com/AdGuardSoftwareLimited/ext-translate/compare/v2.0.1...HEAD
