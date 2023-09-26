import { AvailableLocales } from '../src/plural';
import { isTranslationValid } from '../src/validator';

describe('validator', () => {
    it('returns true if message consists only from string nodes', () => {
        const baseMessage = 'test string';
        const targetMessage = 'тестовая строка';
        const locale = AvailableLocales.ru;

        const result = isTranslationValid(baseMessage, targetMessage, locale);
        expect(result).toBeTruthy();
    });

    it('returns true if message has the same tag nodes count', () => {
        const baseMessage = 'test string <a>has node</a>';
        const targetMessage = 'тестовая строка <a>с нодой</a>';
        const locale = AvailableLocales.ru;

        const result = isTranslationValid(baseMessage, targetMessage, locale);
        expect(result).toBeTruthy();
    });

    it('returns false if translation has wrong tag', () => {
        const baseMessage = 'test string <a>has node</a>';
        const targetMessage = 'тестовая строка <b>с нодой</b>';
        const locale = AvailableLocales.ru;

        const result = isTranslationValid(baseMessage, targetMessage, locale);
        expect(result).toBeFalsy();
    });

    it('returns true if placeholders are same', () => {
        const baseMessage = 'test string %placeholder%';
        const targetMessage = 'тестовая строка %placeholder%';
        const locale = AvailableLocales.ru;

        const result = isTranslationValid(baseMessage, targetMessage, locale);
        expect(result).toBeTruthy();
    });

    it('returns false if translators changed placeholder value', () => {
        const baseMessage = 'test string %placeholder%';
        const targetMessage = 'тестовая строка %плейсхолдер%';
        const locale = AvailableLocales.ru;

        const result = isTranslationValid(baseMessage, targetMessage, locale);
        expect(result).toBeFalsy();
    });

    it('returns false if target string is not valid', () => {
        const baseMessage = 'test string <a>has node</a>';
        const targetMessage = 'тестовая строка с нодой';
        const locale = AvailableLocales.ru;

        const result = isTranslationValid(baseMessage, targetMessage, locale);
        expect(result).toBeFalsy();
    });

    it('returns false if target has same number of nodes, but node is is with another type', () => {
        const baseMessage = 'test string <a>has node</a>';
        const targetMessage = 'тестовая строка с нодой %placeholder%';
        const locale = AvailableLocales.ru;

        const result = isTranslationValid(baseMessage, targetMessage, locale);
        expect(result).toBeFalsy();
    });

    it('validates nested nodes', () => {
        const baseMessage = 'test string <a>has <b>nested</b> node</a>';
        const targetMessage = 'тестовая строка <a>имеет <b>встроенную</b> ноду</a>';
        const locale = AvailableLocales.ru;

        const result = isTranslationValid(baseMessage, targetMessage, locale);
        expect(result).toBeTruthy();
    });

    it('validates even if there were added text nodes', () => {
        const baseMessage = 'test string <a>has tag node</a>';
        const targetMessage = 'тестовая строка <a>имеет тэг ноду</a> и текстовую';
        const locale = AvailableLocales.ru;

        const result = isTranslationValid(baseMessage, targetMessage, locale);
        expect(result).toBeTruthy();
    });

    it('validates even if nodes were rearranged', () => {
        const baseMessage = '<b>b node</b> <a>a node</a>';
        const targetMessage = '<a>a нода</a> <b>b нода</b>';
        const locale = AvailableLocales.ru;

        const result = isTranslationValid(baseMessage, targetMessage, locale);
        expect(result).toBeTruthy();
    });

    describe('validates plural forms if needed', () => {
        test.each([
            {
                baseMessage: 'Traffic renews today | Traffic renews in %days% day | Traffic renews in %days% days',
                targetMessage: 'Veri bugün yenileniyor | Veri %days% gün içinde yenileniyor',
                locale: AvailableLocales.tr,
            },
            {
                baseMessage: '| Create password, at least %count% character | Create password, at least %count% characters',
                targetMessage: '| Créez un mot de passe, contenant au moins %count% caractère | Créez un mot de passe, contenant au moins %count% caractères',
                locale: AvailableLocales.fr,
            },
            {
                baseMessage: 'Traffic renews today | Traffic renews in %days% day | Traffic renews in %days% days',
                targetMessage: '通信量は本日更新されます | 通信量は後%days%日で更新されます',
                locale: AvailableLocales.ja,
            }
        ])('$locale - $targetMessage', ({ baseMessage, targetMessage, locale }) => {
            const isValid = isTranslationValid(baseMessage, targetMessage, locale);
            expect(isValid).toBeTruthy();
        });
    });

    describe('invalidates translation - error is thrown', () => {
        test.each([
            {
                baseMessage: 'Traffic renews today | Traffic renews in %days% day | Traffic renews in %days% days',
                targetMessage: 'Veri bugün yenileniyor | Veri %days% gün içinde yenileniyor | Veri %days% gün içinde yenileniyor',
                locale: AvailableLocales.tr,
                expectedError: 'Invalid plural forms',
            },
            {
                baseMessage: 'An error occurred, please contact us via <a>support@example.com</a>',
                targetMessage: 'Bir hata oluştu, lütfen <a>support@example.com<a> adresinden bizimle iletişime geçin',
                locale: AvailableLocales.tr,
                expectedError: 'String has unbalanced tags',
            }
        ])('$locale - $targetMessage', ({ baseMessage, targetMessage, locale, expectedError }) => {
            expect(() => {
                isTranslationValid(baseMessage, targetMessage, locale);
            }).toThrow(expectedError);
        });
    });

    describe('invalidates translation - false is returned', () => {
        test.each([
            // invalid structure of zero plural form in target message
            {
                baseMessage: 'Traffic renews today | Traffic renews in %days% day | Traffic renews in %days% days',
                targetMessage: 'Veri %days% gün içinde yenileniyor | Veri %days% gün içinde yenileniyor',
                locale: AvailableLocales.tr,
            },
            // invalid structure of first plural form in target message
            {
                baseMessage: 'Traffic renews today | Traffic renews in %days% day | Traffic renews in %days% days',
                targetMessage: 'Veri bugün yenileniyor | Veri %days% gün %days% içinde yenileniyor',
                locale: AvailableLocales.tr,
            },
        ])('$locale - $targetMessage', ({ baseMessage, targetMessage, locale }) => {
            const isValid = isTranslationValid(baseMessage, targetMessage, locale);
            expect(isValid).toBeFalsy();
        });
    });
});
