import { I18nInterface, Translator } from "../Translator";
import type React from 'react';

interface ValueReactFunc {
    (children: React.ReactChildren): React.ReactChildren
}

interface ValuesReact {
    [key: string]: ValueReactFunc | React.ReactChildren,
}

interface createElement {
    (type: string, props?: React.Attributes | null, ...children: React.ReactNode[]): React.ReactChildren
}

export interface ReactCustom {
    createElement: createElement
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
export const createReactTranslator = (i18n: I18nInterface, React: ReactCustom): Translator => {
    /**
     * Helps to build nodes without values
     *
     * @param tagName
     * @param children
     */
    const createReactElement = (tagName: string, children: React.ReactChildren) => {
        if (children) {
            return React.createElement(tagName, null, React.Children.toArray(children));
        }
        return React.createElement(tagName, null);
    };

    /**
     * Function creates default values to be used if user didn't provide function values for tags
     */
    const createDefaultValues = (): ValuesReact => ({
        p: (children) => createReactElement('p', children),
        b: (children) => createReactElement('b', children),
        strong: (children) => createReactElement('strong', children),
        tt: (children) => createReactElement('tt', children),
        s: (children) => createReactElement('s', children),
        i: (children) => createReactElement('i', children),
    });

    const reactMessageConstructor = (formatted: string[]): React.ReactNode => {
        const reactChildren = React.Children.toArray(formatted);

        // if there is only strings in the array we join them
        if (reactChildren.every((child: React.ReactNode | string) => typeof child === 'string')) {
            return reactChildren.join('');
        }

        return reactChildren;
    };

    const defaultValues = createDefaultValues();

    return new Translator(i18n, reactMessageConstructor, defaultValues);
};
