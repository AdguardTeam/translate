import { isTranslationValid } from '../src/validator';

describe('validator', () => {
    it('returns true if message consists only from string nodes', () => {
        const baseMessage = 'test string';
        const targetMessage = 'тестовая строка';

        const result = isTranslationValid(baseMessage, targetMessage);
        expect(result).toBeTruthy();
    });

    it('returns true if message has the same tag nodes count', () => {
        const baseMessage = 'test string <a>has node</a>';
        const targetMessage = 'тестовая строка <a>с нодой</a>';

        const result = isTranslationValid(baseMessage, targetMessage);
        expect(result).toBeTruthy();
    });

    it('returns false if translation has wrong tag', () => {
        const baseMessage = 'test string <a>has node</a>';
        const targetMessage = 'тестовая строка <b>с нодой</b>';

        const result = isTranslationValid(baseMessage, targetMessage);
        expect(result).toBeFalsy();
    });

    it('returns true if placeholders are same', () => {
        const baseMessage = 'test string %placeholder%';
        const targetMessage = 'тестовая строка %placeholder%';

        const result = isTranslationValid(baseMessage, targetMessage);
        expect(result).toBeTruthy();
    });

    it('returns false if translators changed placeholder value', () => {
        const baseMessage = 'test string %placeholder%';
        const targetMessage = 'тестовая строка %плейсхолдер%';

        const result = isTranslationValid(baseMessage, targetMessage);
        expect(result).toBeFalsy();
    });

    it('returns false if target string is not valid', () => {
        const baseMessage = 'test string <a>has node</a>';
        const targetMessage = 'тестовая строка с нодой';

        const result = isTranslationValid(baseMessage, targetMessage);
        expect(result).toBeFalsy();
    });

    it('returns false if target has same number of nodes, but node is is with another type', () => {
        const baseMessage = 'test string <a>has node</a>';
        const targetMessage = 'тестовая строка с нодой %placeholder%';

        const result = isTranslationValid(baseMessage, targetMessage);
        expect(result).toBeFalsy();
    });

    it('validates nested nodes', () => {
        const baseMessage = 'test string <a>has <b>nested</b> node</a>';
        const targetMessage = 'тестовая строка <a>имеет <b>встроенную</b> ноду</a>';

        const result = isTranslationValid(baseMessage, targetMessage);
        expect(result).toBeTruthy();
    });

    it('validates even if there were added text nodes', () => {
        const baseMessage = 'test string <a>has tag node</a>';
        const targetMessage = 'тестовая строка <a>имеет тэг ноду</a> и текстовую';

        const result = isTranslationValid(baseMessage, targetMessage);
        expect(result).toBeTruthy();
    });

    it('validates even if nodes were rearranged', () => {
        const baseMessage = '<b>b node</b> <a>a node</a>';
        const targetMessage = '<a>a нода</a> <b>b нода</b>';

        const result = isTranslationValid(baseMessage, targetMessage);
        expect(result).toBeTruthy();
    });
});
