# AdGuard Translate

<p align="center">
  Simple internationalization library with React integration
</p>

## Description

> **Note:** This package is developed in
> [AdGuardSoftwareLimited/ext-translate](https://github.com/AdGuardSoftwareLimited/ext-translate).
> The [AdguardTeam/translate](https://github.com/AdguardTeam/translate)
> repository is a public mirror.

**AdGuard Translate** is a TypeScript internationalization library for
AdGuard product developers building browser extensions and web applications.
It provides a unified i18n layer across AdGuard products, solving the
problem of inconsistent translation handling between different codebases.

The library supports message translation with placeholder substitution,
XML tag interpolation (essential for UI framework integration), and plural
form rules for ~80 locales. It ships with React and Preact integrations and
a translation validator for CI/CD quality gates. It has zero runtime
dependencies.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Messages Format](#messages-format)
  - [Placeholders](#placeholders)
  - [Tags](#tags)
  - [Plural Strings](#plural-strings)
- [API Overview](#api-overview)
- [Usage Examples](#usage-examples)
  - [Basic Translation](#basic-translation)
  - [Plural Forms](#plural-forms)
  - [React Integration](#react-integration)
  - [Translation Validation](#translation-validation)
- [Configuration](#configuration)
- [Documentation](#documentation)

---

## Installation

```bash
npm install @adguard/translate
```

Or with Yarn:

```bash
yarn add @adguard/translate
```

React and Preact are optional peer dependencies — install them only if you
use the corresponding plugin.

---

## Quick Start

Import the library, implement the `I18nInterface`, and start translating:

```ts
import { translate, I18nInterface } from '@adguard/translate';

const i18n: I18nInterface = {
  getMessage(key) {
    const messages: Record<string, string> = {
      greeting: 'Hello, %name%!',
    };
    return messages[key];
  },
  getUILanguage() { return 'en'; },
  getBaseMessage(key) {
    const messages: Record<string, string> = {
      greeting: 'Hello, %name%!',
    };
    return messages[key];
  },
  getBaseUILanguage() { return 'en'; },
};

const t = translate.createTranslator(i18n);

t.getMessage('greeting', { name: 'World' }); // "Hello, World!"
```

---

## Messages Format

### Placeholders

Placeholders are wrapped in `%` marks:

```
"agreement_consent": {
    "message": "Servers number %count%"
}
```

Literal `%` characters must be escaped with another `%`:

```
"discount": {
    "message": "You have 50%% discount"
}
```

### Tags

Messages support open/close tags with custom renderers:

```
<a>link</a> to the text
```

And void (self-closing) tags:

```
<img>
```

The following tags are available by default and do not need explicit
renderers: `b`, `p`, `strong`, `tt`, `s`, `i`.

### Plural Strings

Plural strings are separated by `|`:

```
No servers | %count% server | %count% servers
```

Rules for plural strings:

1. Forms are divided by `|`.
2. The number of forms must match the locale's plural rule count
   (see the [CLDR plural rules table](https://github.com/translate/l10n-guide/blob/master/docs/l10n/pluralforms.rst)).
3. The first form is the zero form. If omitted, the zero form returns an
   empty string:

```
| %count% server | %count% servers
```

---

## API Overview

### `translate.createTranslator(i18n, messageConstructor?, values?)`

Creates a `Translator` instance that returns strings. Accepts an optional
`messageConstructor` for custom output formats (e.g., building DOM nodes
instead of strings) and optional default tag values.

### `translate.createReactTranslator(i18n, React, defaults?)`

Creates a `Translator` that returns React nodes. Tag handler functions
receive React children and must return React elements.

### `translate.createPreactTranslator(i18n, Preact, defaults?)`

Creates a `Translator` that returns Preact component children. Tag handler
functions receive Preact children and must return Preact elements.

### `Translator.getMessage(key, params?)`

Translates a message by key, substituting placeholders and tags with values
from `params`. Throws if the key is not found.

### `Translator.getPlural(key, number, params?)`

Selects the correct plural form based on `number` and the current locale,
then translates it. Adds `count` to `params` automatically.

### `validator.isTranslationValid(baseMessage, translatedMessage, locale)`

Validates that a translated message has the same AST structure (tags and
placeholders) as the base message. For plural strings, also validates that
the number of forms is correct for the locale. Returns `true` if valid,
throws on structurally invalid input.

### `validator.isPluralFormValid(message, locale)`

Checks that a message has the correct number of plural forms for the given
locale. Returns `true` if valid, `false` otherwise.

---

## Usage Examples

### Basic Translation

```ts
const t = translate.createTranslator(i18n);

const message = t.getMessage('agreement_consent', {
  eula: (chunks) => `<button class="privacy-link">${chunks}</button>`,
});
// '<button class="privacy-link">EULA</button>'
```

### Plural Forms

```ts
t.getPlural('servers_count', 1);   // "1 server"
t.getPlural('servers_count', 5);   // "5 servers"
t.getPlural('servers_count', 0);   // "No servers"
```

### React Integration

```tsx
const t = translate.createReactTranslator(i18n, React);

const element = t.getMessage('agreement_consent', {
  eula: (chunks) => (
    <button className="auth__term" onClick={handleEulaClick}>
      {chunks}
    </button>
  ),
});
// Renders: You agree to our <button class="auth__term">EULA</button>
```

### Translation Validation

```ts
import { validator } from '@adguard/translate';

// Simple message validation
validator.isTranslationValid(
  'test string <a>has node</a>',
  'тестовая строка <a>с нодой</a>',
  'ru',
); // true

// Plural form validation
validator.isPluralFormValid(
  '%count% серверов | %count% сервер | %count% сервера | %count% серверов',
  'ru',
); // true (Russian has 4 plural forms)
```

---

## Configuration

### I18nInterface

Consumers must implement `I18nInterface` to provide translations:

```ts
interface I18nInterface {
  getMessage(key: string): string;
  getUILanguage(): Locale;
  getBaseMessage(key: string): string;
  getBaseUILanguage(): Locale;
}
```

In browser extensions, this is typically implemented using `browser.i18n`.

### Default Tags for React / Preact

The React and Preact translators include built-in renderers for `p`, `b`,
`strong`, `tt`, `s`, and `i`. You can override or extend these via the
`defaults` parameter:

```ts
const t = createReactTranslator(i18n, React, {
  override: false,
  tags: [{ key: 'custom', createdTag: 'span' }],
});
```

### Custom Message Constructor

For advanced use cases (e.g., building virtual DOM nodes directly), pass a
`MessageConstructorInterface` function. It receives an array of formatted
string parts and returns your desired output type.

---

## Documentation

- [Development](DEVELOPMENT.md)
- [Changelog](CHANGELOG.md)
- [LLM agent rules](AGENTS.md)
