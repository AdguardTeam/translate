import {
    tagNode,
    textNode,
    isNode,
    placeholderNode,
    voidTagNode,
    Node,
} from './nodes';

enum STATE {
    /**
     * Parser function switches to the text state when parses simple text,
     * or content between open and close tags
     */
    TEXT = 'text',

    /**
     * Parser function switches to the tag state when meets open tag brace ("<"), and switches back,
     * when meets closing tag brace (">")
     */
    TAG = 'tag',

    /**
     * Parser function switches to the placeholder state when meets in the text
     * open placeholders brace ("{") and switches back to the text state,
     * when meets close placeholder brace ("}")
     */
    PLACEHOLDER = 'placeholder',
}

const CONTROL_CHARS = {
    TAG_OPEN_BRACE: '<',
    TAG_CLOSE_BRACE: '>',
    CLOSING_TAG_MARK: '/',
    PLACEHOLDER_MARK: '%',
};

interface Context {
    /**
     * Stack is used to keep and search nested tag nodes
     */
    stack: (Node | string)[],

    /**
     * Result is stack where function allocates nodes
     */
    result: Node[],

    /**
     * Accumulated text value
     */
    text: string,

    /**
     * Saves index of the last state change from the text state,
     * used to restore parsed text if we moved into other state wrongly
     */
    lastTextStateChangeIdx: number,

    /**
     * Current char
     */
    currChar?: string,

    /**
     * Current char index
     */
    currIdx: number,

    /**
     * Accumulated placeholder value
     */
    placeholder: string,

    /**
     * Parsed string
     */
    str: string,

    /**
     * Accumulated tag value
     */
    tag: string,
}

/**
 * Checks if text length is enough to create text node
 * If text node created, then if stack is not empty it is pushed into stack,
 * otherwise into result
 * @param context
 */
const createTextNodeIfPossible = (context: Context) => {
    const { text } = context;

    if (text.length > 0) {
        const node = textNode(text);
        if (context.stack.length > 0) {
            context.stack.push(node);
        } else {
            context.result.push(node);
        }
    }

    context.text = '';
};

/**
 * Checks if lastFromStack tag has any attributes
 * @param lastFromStack
 */
const hasAttributes = (lastFromStack: string) => {
    // e.g. "a class" or "a href='#'"
    const tagStrParts = lastFromStack.split(' ');
    return tagStrParts.length > 1;
};

interface StateHandlerFunc {
    (context: Context): STATE;
}

/**
 * Handles text state
 */
const textStateHandler: StateHandlerFunc = (context: Context): STATE => {
    const { currChar, currIdx } = context;

    // switches to the tag state
    if (currChar === CONTROL_CHARS.TAG_OPEN_BRACE) {
        context.lastTextStateChangeIdx = currIdx;
        return STATE.TAG;
    }

    // switches to the placeholder state
    if (currChar === CONTROL_CHARS.PLACEHOLDER_MARK) {
        context.lastTextStateChangeIdx = currIdx;
        return STATE.PLACEHOLDER;
    }

    // remains in the text state
    context.text += currChar;
    return STATE.TEXT;
};

/**
 * Handles placeholder state
 * @param context
 */
const placeholderStateHandler: StateHandlerFunc = (context: Context): STATE => {
    const {
        currChar,
        currIdx,
        lastTextStateChangeIdx,
        placeholder,
        stack,
        result,
        str,
    } = context;

    if (currChar === CONTROL_CHARS.PLACEHOLDER_MARK) {
        // if distance between current index and last state change equal to 1,
        // it means that placeholder mark was escaped by itself e.g. "%%",
        // so we return to the text state
        if (currIdx - lastTextStateChangeIdx === 1) {
            context.text += str.substring(lastTextStateChangeIdx, currIdx);
            return STATE.TEXT;
        }

        createTextNodeIfPossible(context);
        const node = placeholderNode(placeholder);

        // push node to the appropriate stack
        if (stack.length > 0) {
            stack.push(node);
        } else {
            result.push(node);
        }

        context.placeholder = '';
        return STATE.TEXT;
    }

    context.placeholder += currChar;
    return STATE.PLACEHOLDER;
};

/**
 * Switches current state to the tag state and returns tag state handler
 */
const tagStateHandler: StateHandlerFunc = (context: Context): STATE => {
    const {
        currChar,
        text,
        stack,
        result,
        lastTextStateChangeIdx,
        currIdx,
        str,
    } = context;

    let { tag } = context;

    // if found tag end ">"
    if (currChar === CONTROL_CHARS.TAG_CLOSE_BRACE) {
        // if the tag is close tag e.g. </a>
        if (tag.indexOf(CONTROL_CHARS.CLOSING_TAG_MARK) === 0) {
            // remove slash from tag
            tag = tag.substring(1);

            let children: Node[] = [];
            if (text.length > 0) {
                children.push(textNode(text));
                context.text = '';
            }

            let pairTagFound = false;
            // looking for the pair to the close tag
            while (!pairTagFound && stack.length > 0) {
                const lastFromStack = stack.pop() as (Node | string);
                // if tag from stack equal to close tag
                if (lastFromStack === tag) {
                    // create tag node
                    const node = tagNode(tag, children);
                    // and add it to the appropriate stack
                    if (stack.length > 0) {
                        stack.push(node);
                    } else {
                        result.push(node);
                    }
                    children = [];
                    pairTagFound = true;
                } else if (isNode(lastFromStack)) {
                    // add nodes between close tag and open tag to the children
                    children.unshift(lastFromStack as Node);
                } else {
                    if (typeof lastFromStack === 'string' && hasAttributes(lastFromStack)) {
                        throw new Error(`Tags in string should not have attributes: ${str}`);
                    } else {
                        throw new Error(`String has unbalanced tags: ${str}`);
                    }
                }
                if (stack.length === 0 && children.length > 0) {
                    throw new Error(`String has unbalanced tags: ${str}`);
                }
            }
            context.tag = '';
            return STATE.TEXT;
        }

        // if the tag is void tag e.g. <img/>
        if (tag.lastIndexOf(CONTROL_CHARS.CLOSING_TAG_MARK) === tag.length - 1) {
            tag = tag.substring(0, tag.length - 1);
            createTextNodeIfPossible(context);
            const node = voidTagNode(tag);
            // add node to the appropriate stack
            if (stack.length > 0) {
                stack.push(node);
            } else {
                result.push(node);
            }
            context.tag = '';
            return STATE.TEXT;
        }

        createTextNodeIfPossible(context);
        stack.push(tag);
        context.tag = '';
        return STATE.TEXT;
    }

    // If we meet open tag "<" it means that we wrongly moved into tag state
    if (currChar === CONTROL_CHARS.TAG_OPEN_BRACE) {
        context.text += str.substring(lastTextStateChangeIdx, currIdx);
        context.lastTextStateChangeIdx = currIdx;
        context.tag = '';
        return STATE.TAG;
    }

    context.tag += currChar;
    return STATE.TAG;
};

/**
 * Parses string into AST (abstract syntax tree) and returns it
 * e.g.
 * parse("String to <a>translate</a>") ->
 * ```
 *      [
 *           { type: 'text', value: 'String to ' },
 *           { type: 'tag', value: 'a', children: [{ type: 'text', value: 'translate' }] }
 *      ];
 * ```
 * Empty string is parsed into empty AST (abstract syntax tree): "[]"
 * If founds unbalanced tags, it throws error about it
 *
 * @param {string} str - message in simplified ICU like syntax without plural support
 */
export const parser = (str = ''): Node[] => {
    const context: Context = {
        /**
         * Stack is used to keep and search nested tag nodes
         */
        stack: [],

        /**
         * Result is stack where function allocates nodes
         */
        result: [],

        /**
         * Current char index
         */
        currIdx: 0,

        /**
         * Saves index of the last state change from the text state,
         * used to restore parsed text if we moved into other state wrongly
         */
        lastTextStateChangeIdx: 0,

        /**
         * Accumulated tag value
         */
        tag: '',

        /**
         * Accumulated text value
         */
        text: '',

        /**
         * Accumulated placeholder value
         */
        placeholder: '',

        /**
         * Parsed string
         */
        str,
    };

    const STATE_HANDLERS = {
        [STATE.TEXT]: textStateHandler,
        [STATE.PLACEHOLDER]: placeholderStateHandler,
        [STATE.TAG]: tagStateHandler,
    };

    // Start from text state
    let currentState = STATE.TEXT;

    while (context.currIdx < str.length) {
        context.currChar = str[context.currIdx];
        const currentStateHandler: StateHandlerFunc = STATE_HANDLERS[currentState];
        currentState = currentStateHandler(context);
        context.currIdx += 1;
    }

    const {
        result,
        text,
        stack,
        lastTextStateChangeIdx,
    } = context;

    // Means that tag or placeholder nodes were not closed, so we consider them as text
    if (currentState !== STATE.TEXT) {
        const restText = str.substring(lastTextStateChangeIdx);
        if ((restText + text).length > 0) {
            result.push(textNode(text + restText));
        }
    } else {
        // eslint-disable-next-line no-lonely-if
        if (text.length > 0) {
            result.push(textNode(text));
        }
    }

    if (stack.length > 0) {
        throw new Error(`String has unbalanced tags: ${context.str}`);
    }

    return result;
};
