import { parser } from './parser';
import { isTextNode, Node } from './nodes';
import { isPluralFormValid } from './plural';

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
 * Validates translation against base string by AST (abstract syntax tree) structure
 * @param baseMessage - base message
 * @param translatedMessage - translated message
 */
export const isTranslationValid = (baseMessage: string, translatedMessage: string): boolean => {
    const baseMessageAst = parser(baseMessage);
    const translatedMessageAst = parser(translatedMessage);

    return areAstStructuresSame(baseMessageAst, translatedMessageAst);
};

export const validator = {
    isTranslationValid,
    isPluralFormValid,
};
