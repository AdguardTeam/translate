import type React from 'react';
import { I18nInterface, Translator } from '../Translator';

export interface ReactCustom {
    createElement: typeof React.createElement
    Children: React.ReactChildren
}

/**
 * Creates translation function for strings used in the React components
 * We do not import React directly, because translator module can be used
 * in the modules without React too
 *
 * e.g.
 * const translateReact = createReactTranslator(getMessage, React);
 * in locales folder you should have messages.json file
 * ```
 * message:
 *     "popup_auth_agreement_consent": {
 *          "message": "You agree to our <eula>EULA</eula>",
 *      },
 * ```
 *
 * this message can be retrieved and translated into react components next way:
 *
 * const component = translateReact('popup_auth_agreement_consent', {
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
 * @param React - instance of react library
 */
export const createReactTranslator = <T = React.ReactNode>(
    i18n: I18nInterface, react: ReactCustom, defaults?: {
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
    const createReactElement = (tagName: string, children: React.ReactChildren) => {
        if (children) {
            return react.createElement(tagName, null, react.Children.toArray(children));
        }
        return react.createElement(tagName, null);
    };

    /**
     * Function creates default values to be used if user didn't provide function values for tags
     */
    const createDefaultValues = () => {
        const externalDefaults: Record<string, Function> = {};
        if (defaults) {
            defaults.tags.forEach((t) => {
                externalDefaults[t.key] = (children: React.ReactChildren) => createReactElement(t.createdTag, children);
            });
        }
        if (defaults?.override) {
            return externalDefaults;
        }
        return ({
            p: (children: React.ReactChildren) => createReactElement('p', children),
            b: (children: React.ReactChildren) => createReactElement('b', children),
            strong: (children: React.ReactChildren) => createReactElement('strong', children),
            tt: (children: React.ReactChildren) => createReactElement('tt', children),
            s: (children: React.ReactChildren) => createReactElement('s', children),
            i: (children: React.ReactChildren) => createReactElement('i', children),
            ...externalDefaults
        });
};

    const reactMessageConstructor = (formatted: string[]): React.ReactNode => {
        const reactChildren = react.Children.toArray(formatted);

        // if there is only strings in the array we join them
        if (reactChildren.every((child: React.ReactNode | string) => typeof child === 'string')) {
            return reactChildren.join('');
        }

        return reactChildren;
    };

    const defaultValues = createDefaultValues();

    return new Translator<T>(i18n, reactMessageConstructor, defaultValues);
};
