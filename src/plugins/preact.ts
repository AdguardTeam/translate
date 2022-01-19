import type Preact from 'preact';
import { toChildArray } from 'preact';
import { I18nInterface, Translator } from '../Translator';

export interface PreactCustom {
    createElement: typeof Preact.createElement
}

/**
 * Creates translation function for strings used in the Preact components
 * We do not import Preact directly, because translator module can be used
 * in the modules without Preact too
 *
 * e.g.
 * const translatePreact = createPreactTranslator(getMessage, Preact);
 * in locales folder you should have messages.json file
 * ```
 * message:
 *     "popup_auth_agreement_consent": {
 *          "message": "You agree to our <eula>EULA</eula>",
 *      },
 * ```
 *
 * this message can be retrieved and translated into preact components next way:
 *
 * const component = translatePreact('popup_auth_agreement_consent', {
 *          eula: (chunks) => (
 *              <button
 *                  className="auth__privacy-link"
 *                  onClick={handleEulaClick}
 *              >
 *                  {chunks}
 *              </button>
 *          ),
 *       });
 *
 * Note how functions in the values argument can be used with handlers
 *
 * @param i18n - object with methods which get translated message by key and return current locale
 * @param Preact - instance of preact library
 */
export const createPreactTranslator = <T = Preact.ComponentChildren>(
    i18n: I18nInterface, preact: PreactCustom, defaults?: {
        override?: boolean,
        tags: {
            key: string,
            createdTag: string,
        }[]
    }
): Translator<T> => {
    /**
     * Helps to build nodes without values
     *
     * @param tagName
     * @param children
     */
    const createPreactElement = (tagName: string, children: Preact.ComponentChildren) => {
        if (children) {
            return preact.createElement(tagName, null, toChildArray(children));
        }
        return preact.createElement(tagName, null);
    };

    /**
     * Function creates default values to be used if user didn't provide function values for tags
     */
    const createDefaultValues = () => {
        const externalDefaults: Record<string, Function> = {};
        if (defaults) {
            defaults.tags.forEach((t) => {
                externalDefaults[t.key] = (children: Preact.ComponentChildren) => createPreactElement(t.createdTag, children);
            });
        }
        if (defaults?.override) {
            return externalDefaults;
        }
        return ({
            p: (children: Preact.ComponentChildren) => createPreactElement('p', children),
            b: (children: Preact.ComponentChildren) => createPreactElement('b', children),
            strong: (children: Preact.ComponentChildren) => createPreactElement('strong', children),
            tt: (children: Preact.ComponentChildren) => createPreactElement('tt', children),
            s: (children: Preact.ComponentChildren) => createPreactElement('s', children),
            i: (children: Preact.ComponentChildren) => createPreactElement('i', children),
            ...externalDefaults
        });
};

    const preactMessageConstructor = (formatted: string[]): Preact.ComponentChildren => {
        const preactChildren = toChildArray(formatted);

        // if there is only strings in the array we join them
        if (preactChildren.every((child: Preact.ComponentChildren | string) => typeof child === 'string')) {
            return preactChildren.join('');
        }

        return preactChildren;
    };

    const defaultValues = createDefaultValues();

    return new Translator<T>(i18n, preactMessageConstructor, defaultValues);
};
