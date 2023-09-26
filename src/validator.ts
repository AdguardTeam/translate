import { parser } from './parser';
import { isTextNode, Node } from './nodes';
import {
    getForms,
    hasPluralForm,
    isPluralFormValid,
    Locale,
} from './plural';

/**
 * Compares two AST (abstract syntax tree) structures,
 * view tests for examples
 * @param baseAst
 * @param targetAst
 */
const areAstStructuresSame = (baseAst: Node[], targetAst: Node[]): boolean => {
    const textNodeFilter = (node: Node) => {
        return !isTextNode(node);
    };

    const filteredBaseAst = baseAst.filter(textNodeFilter);

    const filteredTargetAst = targetAst.filter(textNodeFilter);

    // if AST structures have different lengths, they are not equal
    if (filteredBaseAst.length !== filteredTargetAst.length) {
        return false;
    }

    for (let i = 0; i < filteredBaseAst.length; i += 1) {
        const baseNode = filteredBaseAst[i];

        const targetNode = filteredTargetAst.find((node) => {
            return node.type === baseNode.type && node.value === baseNode.value;
        });

        if (!targetNode) {
            return false;
        }

        if (targetNode.children && baseNode.children) {
            const areChildrenSame = areAstStructuresSame(baseNode.children, targetNode.children);
            if (!areChildrenSame) {
                return false;
            }
        }
    }

    return true;
};

/**
 * Validates translation against base string by AST (abstract syntax tree) structure.
 *
 * @param baseMessage Base message.
 * @param translatedMessage Translated message.
 * @param locale Locale of `translatedMessage`.
 *
 * @returns True if translated message is valid, false otherwise:
 * - if base message has no plural forms, it will return true if AST structures are same;
 * - if base message has plural forms, first of all
 *   the function checks if the number of plural forms is correct for the `locale`,
 *   and then it validates AST plural forms structures for base and translated messages.
 *
 * @throws Error for invalid tags in base or translated messages,
 * or if translated message has invalid plural forms.
 */
export const isTranslationValid = (
    baseMessage: string,
    translatedMessage: string,
    locale: Locale,
): boolean => {
    if (hasPluralForm(baseMessage)) {
        const isPluralFormsValid = isPluralFormValid(translatedMessage, locale);
        if (!isPluralFormsValid) {
            throw new Error('Invalid plural forms');
        }

        const baseForms = getForms(baseMessage);
        const translatedForms = getForms(translatedMessage);

        // check a zero form structures of base and translated messages
        if (!isTranslationValid(baseForms[0], translatedForms[0], locale)) {
            return false;
        }
        // and check other forms structures of translated messages against the first form of base message
        for (let i = 1; i < translatedForms.length; i += 1) {
            if (!isTranslationValid(baseForms[1], translatedForms[i], locale)) {
                return false;
            }
        }
        // if no errors, return true after all checks
        return true;
    }

    const baseMessageAst = parser(baseMessage);
    const translatedMessageAst = parser(translatedMessage);

    return areAstStructuresSame(baseMessageAst, translatedMessageAst);
};

export const validator = {
    isTranslationValid,
    isPluralFormValid,
};
