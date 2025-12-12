# Translate Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## 2.0.0 - 2025-12-12

### Changed

- [BREAKING CHANGE] Single '%' signs are not allowed anymore and should be escaped by extra percent sign '%%'.

### Added

- Error throwing on unsupported locale passed to `isTranslationValid()` and `isPluralFormValid()`.

### Fixed

- More specific error logging of `getMessage()` and `getPluralForm()`.


## 1.0.2 - 2023-09-26

### Changed

- `isTranslationValid()` and `isPluralFormValid()` methods.
