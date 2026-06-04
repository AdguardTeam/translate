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

### Custom Labels Reference

Messages support three types of dynamic labels. All of them pull values
from the `params` object passed to `getMessage()` or `getPlural()`:

| Type | Syntax | `params` value type | Example |
|---|---|---|---|
| **Placeholder** | `%name%` | `string` | `{ name: 'World' }` |
| **Tag** | `<tag>...</tag>` | `(children: string) => string` | `{ a: (c) => '<a>'+c+'</a>' }` |
| **Void tag** | `<tag/>` | `string` | `{ img: '<img src="..."/>' }` |

**Placeholders** are replaced verbatim with the matching string value
from `params`:

```
"message": "Hello, %username%!"
// params: { username: 'Alice' }
// result: "Hello, Alice!"
```

**Tags** are replaced by calling the render function with the tag's inner
content as a string argument. The function can wrap or transform the
children:

```
"message": "Read our <terms>Terms of Service</terms>"
// params: { terms: (c) => `<a href="/terms">${c}</a>` }
// result: 'Read our <a href="/terms">Terms of Service</a>'
```

If the `params` value for a tag is a string instead of a function, the
string is used directly and the children are discarded.

**Void tags** are self-closing and replaced with a plain string:

```
"message": "Status: <status-icon/>"
// params: { 'status-icon': '<span class="ok"/>' }
```

#### Edge Cases

| Scenario | Behavior |
|---|---|
| **Escaped percent** `%%` | Produces a literal `%` in output. Use this where a percent sign must appear in a translated message. |
| **Unclosed placeholder** `%name` (no trailing `%`) | **Throws** `Error` with an "Unclosed placeholder marker" message. |
| **Unclosed tag** `<` without `>` | The malformed tag is treated as **literal text** in the output. |
| **Unbalanced tags** `<b>text` without `</b>` | **Throws** `Error` with an "unbalanced tags" message. |
| **Improperly nested tags** `<a><b>text</a></b>` | **Throws** `Error` with an "unbalanced tags" message. |
| **Tag with attributes** `<a class="link">` | **Throws** `Error` with a "Tags should not have attributes" message. |
| **Missing `params` key** for a placeholder, tag, or void tag | **Throws** `Error` with a "value was not provided" message in the formatter. |
| **Void tag with a function** in `params` | **Throws** `Error` (void tags only accept strings). |
| **Default tags** (`<b>`, `<p>`, `<strong>`, `<tt>`, `<s>`, `<i>`) | Built in — no explicit `params` needed. Can be overridden via the `defaults` parameter. |
| **Nested tags** | Tags can contain other tags. The inner tag's render function receives the already-rendered outer content. |
| **`count` in `getPlural()`** | The `count` parameter is automatically set to the numeric `number` argument. Any user-supplied `params.count` is overridden. |
| **Empty zero form** in plural strings | If the first form (before the first `|`) is omitted, the zero form returns an empty string. |

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
