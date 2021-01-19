import { I18nInterface, MessageConstructorInterface, Translator } from './Translator';
import { ValuesAny } from './formatter';
import { createReactTranslator } from './plugins/react';

/**
 * Creates translator instance strings, by default for simple strings
 * @param i18n - function which returns translated message by key
 * @param messageConstructor - function that will collect messages
 * @param values - map with default values for tag converters
 */
const createTranslator = <T = string>(
    i18n: I18nInterface,
    messageConstructor?: MessageConstructorInterface<T>,
    values?: ValuesAny,
): Translator<T> => {
    return new Translator(i18n, messageConstructor, values);
};

const translate = {
    createTranslator,
    createReactTranslator,
};

export { translate };
