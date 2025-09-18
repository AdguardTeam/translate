import { formatter, ValuesAny } from './formatter';
import { Locale, getForm } from './plural';

interface TranslatorInterface<T> {
    getMessage(key: string, params: ValuesAny): T;

    getPlural(key: string, number: number, params: ValuesAny): T;
}

export interface I18nInterface {
    /**
     * Returns message by key for current locale
     * @param key
     */
    getMessage(key: string): string;

    /**
     * Returns current locale code
     * Locale codes should be in the list of Locale
     */
    getUILanguage(): Locale;

    /**
     * Returns base locale message
     * @param key
     */
    getBaseMessage(key: string): string;

    /**
     * Returns base locale code
     */
    getBaseUILanguage(): Locale;
}

export type MessageConstructorInterface<T> = (formatted: string[]) => T;

const defaultMessageConstructor: MessageConstructorInterface<string> = (formatted: string[]) => {
    return formatted.join('');
};

export class Translator<T> implements TranslatorInterface<T> {
    private i18n: I18nInterface;

    private readonly messageConstructor: MessageConstructorInterface<T>;

    private values: ValuesAny;

    constructor(
        i18n: I18nInterface,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        messageConstructor?: MessageConstructorInterface<any>,
        values?: ValuesAny,
    ) {
        this.i18n = i18n;
        this.messageConstructor = messageConstructor || defaultMessageConstructor;
        this.values = values || {};
    }

    /**
     * Retrieves message and translates it, substituting parameters where necessary
     * 
     * IMPORTANT: Always pass string literal keys directly for static analysis compatibility.
     * 
     * @param key - translation message key (must be a string literal)
     * @param params - values used to substitute placeholders and tags
     * 
     * @example
     * // Correct usage - string literals
     * translator.getMessage('filtering_log_preserve_log_on');
     * translator.getMessage('user_settings_title', { name: 'John' });
     * 
     * @example
     * // Incorrect usage - variables and dynamic keys
     * const key = 'filtering_log_preserve_log_on';
     * translator.getMessage(key); // Don't do this
     * translator.getMessage(titleMap[mode]); // Don't do this
     */
    public getMessage(key: string, params: ValuesAny = {}): T {
        let message = this.i18n.getMessage(key);
        if (!message) {
            message = this.i18n.getBaseMessage(key);
            if (!message) {
                throw new Error(`Was unable to find message for key: "${key}"`);
            }
        }
        const formatted = formatter(key, message, { ...this.values, ...params });
        return this.messageConstructor(formatted);
    }

    /**
     * Retrieves correct plural form and translates it
     * 
     * IMPORTANT: Always pass string literal keys directly for static analysis compatibility.
     * 
     * @param key - translation message key (must be a string literal)
     * @param number - plural form number
     * @param params - values used to substitute placeholders or tags if necessary,
     * if params has "count" property it will be overridden by number (plural form number)
     * 
     * @example
     * // Correct usage - string literals
     * translator.getPlural('items_count', count);
     * translator.getPlural('messages_received', messageCount, { user: 'John' });
     * 
     * @example
     * // Incorrect usage - variables and dynamic keys
     * const key = 'items_count';
     * translator.getPlural(key, count); // Don't do this
     * translator.getPlural(pluralKeyMap[type], count); // Don't do this
     */
    public getPlural(key: string, number: number, params: ValuesAny = {}): T {
        let message = this.i18n.getMessage(key);
        let language = this.i18n.getUILanguage();
        if (!message) {
            message = this.i18n.getBaseMessage(key);
            if (!message) {
                throw new Error(`Was unable to find message for key: "${key}"`);
            }
            language = this.i18n.getBaseUILanguage();
        }
        const form = getForm(message, number, language, key);
        const formatted = formatter(key, form, { ...this.values, ...params, count: number });
        return this.messageConstructor(formatted);
    }
}
