import { formatter, ValuesAny } from "./formatter";
import { Locales, getForm } from "./plural";

interface TranslatorInterface {
    getMessage(key: string, params: ValuesAny): string | unknown;

    getPlural(key: string, number: number, params: ValuesAny): string | unknown;
}

export interface I18nInterface {
    /**
     * Returns message by key for current locale
     * @param key
     */
    getMessage(key: string): string;

    /**
     * Returns current locale code
     * Locale codes should be in the list of Locales
     */
    getUILanguage(): Locales;

    /**
     * Returns base locale message
     * @param key
     */
    getBaseMessage(key: string): string;

    /**
     * Returns base locale code
     */
    getBaseUILanguage(): Locales;
}

export interface MessageConstructorInterface {
    (formatted: string[]): unknown;
}

export class Translator implements TranslatorInterface {
    private i18n: I18nInterface;
    private readonly messageConstructor: MessageConstructorInterface;
    private values: ValuesAny;

    private defaultMessageConstructor = (formatted: string[]) => {
        return formatted.join('');
    }

    constructor(i18n: I18nInterface, messageConstructor?: MessageConstructorInterface, values?: ValuesAny) {
        this.i18n = i18n;
        this.messageConstructor = messageConstructor || this.defaultMessageConstructor;
        this.values = values || {};
    }

    public getMessage(key: string, params: ValuesAny = {}): string | unknown {
        let message = this.i18n.getMessage(key);
        if (!message) {
            message = this.i18n.getBaseMessage(key);
            if (!message) {
                throw new Error(`Was unable to find message for key: "${key}"`);
            }
        }
        const formatted = formatter(message, { ...this.values, ...params });
        return this.messageConstructor(formatted);
    }

    public getPlural(key: string, number: number, params: ValuesAny = {}): string | unknown {
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
        const formatted = formatter(form, { ...this.values, ...params });
        return this.messageConstructor(formatted);
    }
}
