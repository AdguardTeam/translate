enum NODE_TYPES {
    PLACEHOLDER = 'placeholder',
    TEXT = 'text',
    TAG = 'tag',
    VOID_TAG = 'void_tag',
}

export interface Node {
    type: NODE_TYPES,
    value: string,
    children?: Node[],
}

export const isTextNode = (node: Node): boolean => {
    return node.type === NODE_TYPES.TEXT;
};

export const isTagNode = (node: Node): boolean => {
    return node.type === NODE_TYPES.TAG;
};

export const isPlaceholderNode = (node: Node): boolean => {
    return node.type === NODE_TYPES.PLACEHOLDER;
};

export const isVoidTagNode = (node: Node): boolean => {
    return node.type === NODE_TYPES.VOID_TAG;
};

export const placeholderNode = (value: string): Node => {
    return { type: NODE_TYPES.PLACEHOLDER, value };
};

export const textNode = (str: string): Node => {
    return { type: NODE_TYPES.TEXT, value: str };
};

export const tagNode = (tagName: string, children: Node[]): Node => {
    const value = tagName.trim();
    return { type: NODE_TYPES.TAG, value, children };
};

export const voidTagNode = (tagName: string): Node => {
    const value = tagName.trim();
    return { type: NODE_TYPES.VOID_TAG, value };
};

/**
 * Checks if target is node
 * @param target
 */
export const isNode = (target: Node | string): boolean => {
    if (typeof target === 'string') {
        return false;
    }
    return !!target.type;
};
