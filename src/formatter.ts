import { parser } from './parser';
import {
    isTextNode,
    isTagNode,
    isPlaceholderNode,
    isVoidTagNode,
    Node,
} from './nodes';

/**
 * Helper functions used by default to assemble strings from tag nodes
 * @param tagName
 * @param children
 */
const createStringElement = (tagName: string, children: string): string => {
    if (children) {
        return `<${tagName}>${children}</${tagName}>`;
    }
    return `<${tagName}/>`;
};

interface ValueFunc {
    (children: string): string;
}

export interface ValuesAny {
    [key: string]: ValueFunc | unknown,
}

export interface Values {
    [key: string]: ValueFunc | string,
}

/**
 * Creates map with default values for tag converters
 */
const createDefaultValues = (): Values => ({
    p: (children) => createStringElement('p', children),
    b: (children) => createStringElement('b', children),
    strong: (children) => createStringElement('strong', children),
    tt: (children) => createStringElement('tt', children),
    s: (children) => createStringElement('s', children),
    i: (children) => createStringElement('i', children),
});

/**
 * This function accepts an AST (abstract syntax tree) which is a result
 * of the parser function call, and converts tree nodes into array of strings replacing node
 * values with provided values.
 * Values is a map with functions or strings, where each key is related to placeholder value
 * or tag value
 * e.g.
 * string "text <tag>tag text</tag> %placeholder%" is parsed into next AST
 *
 *      [
 *          { type: 'text', value: 'text ' },
 *          {
 *              type: 'tag',
 *              value: 'tag',
 *              children: [{ type: 'text', value: 'tag text' }],
 *          },
 *          { type: 'text', value: ' ' },
 *          { type: 'placeholder', value: 'placeholder' }
 *      ];
 *
 * this AST after format and next values
 *
 *      {
 *          // here used template strings, but it can be react components as well
 *          tag: (chunks) => `<b>${chunks}</b>`,
 *          placeholder: 'placeholder text'
 *      }
 *
 * will return next array
 *
 * [ 'text ', '<b>tag text</b>', ' ', 'placeholder text' ]
 *
 * as you can see, <tag> was replaced by <b>, and placeholder was replaced by placeholder text
 *
 * @param ast - AST (abstract syntax tree)
 * @param values
 */
const format = (ast: Node[] = [], values: Values = {}): string[] => {
    const result: string[] = [];

    const tmplValues: Values = { ...createDefaultValues(), ...values };

    let i = 0;
    while (i < ast.length) {
        const currentNode = ast[i] as Node;
        // if current node is text node, there is nothing to change, append value to the result
        if (isTextNode(currentNode)) {
            result.push(currentNode.value);
        } else if (isTagNode(currentNode)) {
            const children = [...format(currentNode.children, tmplValues)];
            const value = tmplValues[currentNode.value];
            if (value) {
                // TODO consider using strong typing
                if (typeof value === 'function') {
                    result.push(value(children.join('')));
                } else {
                    result.push(value);
                }
            } else {
                throw new Error(`Value ${currentNode.value} wasn't provided`);
            }
        } else if (isVoidTagNode(currentNode)) {
            const value = tmplValues[currentNode.value];
            // TODO consider using strong typing
            if (value && typeof value === 'string') {
                result.push(value);
            } else {
                throw new Error(`Value ${currentNode.value} wasn't provided`);
            }
        } else if (isPlaceholderNode(currentNode)) {
            const value = tmplValues[currentNode.value];
            // TODO consider using strong typing
            if (value && typeof value === 'string') {
                result.push(value);
            } else {
                throw new Error(`Value ${currentNode.value} wasn't provided`);
            }
        }
        i += 1;
    }

    return result;
};

/**
 * Function gets AST (abstract syntax tree) or string and formats messages,
 * replacing values accordingly
 * e.g.
 *      const message = formatter('<a>some text</a>', {
 *          a: (chunks) => `<a href="#">${chunks}</a>`,
 *      });
 *      console.log(message); // ['<a href="#">some text</a>']
 * @param message
 * @param [values]
 */
export const formatter = (message?: string, values?: ValuesAny): string[] => {
    const ast = parser(message);

    const preparedValues: Values = {};

    // convert values to strings if not a function
    if (values) {
        Object.keys(values).forEach((key) => {
            const value = values[key];
            // TODO consider using strong typing
            if (typeof value === 'function') {
                preparedValues[key] = value as ValueFunc;
            } else {
                preparedValues[key] = String(value);
            }
        });
    }

    return format(ast, preparedValues);
};
