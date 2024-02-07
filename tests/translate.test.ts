import React from 'react';

import { translate } from '../src/translate';
import { Locale } from "../src/plural";

interface MessagesInterface {
    [key: string]: string;
}

describe('translate', () => {
    describe('createTranslator', () => {
        const i18n = (() => {
            const messages: MessagesInterface = {
                simple: '<b>bold</b> in the text',
                plural: '| %count% hour | %count% hours'
            };

            return {
                getMessage(key: string): string {
                    return messages[key];
                },

                getUILanguage(): Locale {
                    return 'en';
                },

                getBaseMessage(key: string): string {
                    return messages[key];
                },

                getBaseUILanguage(): Locale {
                    return 'en';
                }
            }
        })();

        const translator = translate.createTranslator(i18n);

        it('translates singular strings', () => {
            const message = translator.getMessage('simple');
            expect(message).toBe('<b>bold</b> in the text');
        });

        it('translates plural strings', () => {
            let message = translator.getPlural('plural', 1, { count: 1 });
            expect(message).toBe('1 hour');

            message = translator.getPlural('plural', 2, { count: 2 });
            expect(message).toBe('2 hours');
        });
    });

    describe('createReactTranslator', () => {
        const i18n = (() => {
            const messages: MessagesInterface = {
                simple: '<b>bold</b> in the text',
                str_with_percent_sigh: '%discount%%% off: <span>%time_left%</span>',
                plural: '| %count% hour | %count% hours',
                plural_with_placeholders: '| %count% hour %foo% | %count% hours %foo% ',
                plural_with_placeholders_inside_tag: "| %count% year with <span>%discount%%% off</span> | %count% years with <span>%discount%%% off</span>",
            };

            return {
                getMessage(key: string): string {
                    return messages[key];
                },

                getUILanguage(): Locale {
                    return 'en';
                },

                getBaseMessage(key: string): string {
                    return messages[key];
                },

                getBaseUILanguage(): Locale {
                    return 'en';
                }
            }
        })();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const translator = translate.createReactTranslator(i18n, React as any);

        it('translates singular strings', () => {
            const message = translator.getMessage('simple');
            expect(message).toEqual(React.Children.toArray([React.createElement('b', null , ['bold']), ' in the text']));
        });

        it('translates strings with placeholder and single percent sigh', () => {
            const message = translator.getMessage('str_with_percent_sigh', {
                discount: 60,
                time_left: '01:34:12',
                span: (chunks: string) => {
                    return React.createElement('span', null, [chunks]);
                },
            });

            expect(message).toEqual(React.Children.toArray([
                '60',
                '% off: ',
                React.createElement('span', null, ['01:34:12']),
            ]));
        });

        it('translates plural strings', () => {
            let message = translator.getPlural('plural', 1, { count: 1 });
            expect(message).toBe('1 hour');

            message = translator.getPlural('plural', 2, { count: 2 });
            expect(message).toBe('2 hours');
        });

        it('translates plural strings without parameters', () => {
            let message = translator.getPlural('plural', 1);
            expect(message).toBe('1 hour');

            message = translator.getPlural('plural', 2);
            expect(message).toBe('2 hours');
        });

        it('translates plural number with parameters', () => {
            let message = translator.getPlural('plural_with_placeholders', 1, { foo: 'bar' });
            expect(message).toBe('1 hour bar');

            message = translator.getPlural('plural_with_placeholders', 2, { foo: 'bar' });
            expect(message).toBe('2 hours bar');
        });

        it('translates plural number with parameters and placeholder with percent sigh inside tag', () => {
            let message = translator.getPlural('plural_with_placeholders_inside_tag', 1, {
                discount: 55,
                span: (chunks: string) => {
                    return React.createElement('span', null, [chunks]);
                },
            });
            expect(message).toEqual(React.Children.toArray([
                '1',
                ' year with ',
                React.createElement('span', null, ['55% off']),
            ]));

            message = translator.getPlural('plural_with_placeholders_inside_tag', 2, {
                discount: 80,
                span: (chunks: string) => {
                    return React.createElement('span', null, [chunks]);
                },
            });
            expect(message).toEqual(React.Children.toArray([
                '2',
                ' years with ',
                React.createElement('span', null, ['80% off']),
            ]));
        });

    });
})
