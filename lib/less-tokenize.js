const singleQuote = '\''.charCodeAt(0);
const doubleQuote = '"'.charCodeAt(0);
const backslash = '\\'.charCodeAt(0);
const slash = '/'.charCodeAt(0);
const newline = '\n'.charCodeAt(0);
const space = ' '.charCodeAt(0);
const feed = '\f'.charCodeAt(0);
const tab = '\t'.charCodeAt(0);
const carriageReturn = '\r'.charCodeAt(0);
const openedParenthesis = '('.charCodeAt(0);
const closedParenthesis = ')'.charCodeAt(0);
const openedCurlyBracket = '{'.charCodeAt(0);
const closedCurlyBracket = '}'.charCodeAt(0);
const semicolon = ';'.charCodeAt(0);
const asterisk = '*'.charCodeAt(0);
const ampersand = '&'.charCodeAt(0);
const colon = ':'.charCodeAt(0);
const comma = ','.charCodeAt(0);
const dot = '.'.charCodeAt(0);
const atRule = '@'.charCodeAt(0);
const tilde = '~'.charCodeAt(0);
const hash = '#'.charCodeAt(0);
const atEndPattern = /[ \n\t\r\f\{\(\)'"`\\;/]/g;
const wordEndPattern = /[ \n\t\r\f\(\)\{\}:,;@!'"`\\#]|\/(?=\*)/g;
const badBracketPattern = /.[\\\/\("'\n]/;
const variablePattern = /^@[^:\(\{]+:/;
const hashColorPattern = /^#[0-9a-fA-F]{6}$|^#[0-9a-fA-F]{3}$/;
const nestedExtendWord = '&:extend';
const nestedExtendWordLength = nestedExtendWord.length;

function isMixinName (str) {
    const firstSymbolCode = str ? str[0].charCodeAt(0) : null;

    return (firstSymbolCode === dot || firstSymbolCode === hash) &&

            // ignore hashes used for colors
        hashColorPattern.test(str) === false &&

            // ignore dots used for unpadded fractional numbers
        /\.[0-9]/.test(str) === false;
}

function findEndOfExpression (css, length, i) {
    let openedParenthesisBlocks = 0;
    let openedCurlyBlocks = 0;

    for (; i < length; ++i) {
        const symbolCode = css[i].charCodeAt(0);

        // find the on of escaped expression
        if (
            !openedParenthesisBlocks && !openedCurlyBlocks &&
            (symbolCode === semicolon || symbolCode === closedCurlyBracket)
        ) {
            return i - 1;
        }

        switch (symbolCode) {
            case openedCurlyBracket:
                openedCurlyBlocks++;
                break;

            case closedCurlyBracket:
                openedCurlyBlocks--;
                break;

            case openedParenthesis:
                openedParenthesisBlocks++;
                break;

            case closedParenthesis:
                openedParenthesisBlocks--;
                break;

            default:
                break;
        }
    }

    return -1;
}

function findClosedParenthesisPosition (css, length, start) {
    let openedParenthesisCount = 0;

    for (let i = start; i < length; i++) {
        const symbol = css[i];

        if (symbol === '(') {
            openedParenthesisCount++;
        } else if (symbol === ')') {
            openedParenthesisCount--;

            if (!openedParenthesisCount) {
                return i;
            }
        }
    }

    return -1;
}

function unclosed (state, what) {
    throw state.input.error(`Unclosed ${ what }`, state.line, state.pos - state.offset);
}

function isEscaping (state) {
    let result = false;

    if (state.symbolCode === tilde) {
        const quotePattern = /\s*['"`]/g;

        quotePattern.lastIndex = state.pos + 1;

        const match = quotePattern.exec(state.css);

        if (match && match.index === state.pos + 1) {
            const end = findEndOfExpression(state.css, state.length, quotePattern.lastIndex + 1);

            if (end !== -1) {
                result = true;
                state.nextPos = end;
            }
        }
    }

    return result;
}

function tokenizeBasicSymbol (state) {
    state.tokens.push([
        state.symbol, state.symbol,
        state.line, state.pos - state.offset
    ]);
}

function tokenizeWhitespace (state) {
    state.nextPos = state.pos;

    // collect all neighbour space symbols
    do {
        state.nextPos += 1;
        state.symbolCode = state.css.charCodeAt(state.nextPos);
        if (state.symbolCode === newline) {
            state.offset = state.nextPos;
            state.line += 1;
        }
    } while (
    state.symbolCode === space ||
    state.symbolCode === newline ||
    state.symbolCode === tab ||
    state.symbolCode === carriageReturn ||
    state.symbolCode === feed
        );

    state.tokens.push(['space', state.css.slice(state.pos, state.nextPos)]);
    state.pos = state.nextPos - 1;
}

function tokenizeComma (state) {
    state.tokens.push([
        'word', state.symbol,
        state.line, state.pos - state.offset,
        state.line, state.pos - state.offset + 1
    ]);
}

// it is not very reasonable to reduce complexity beyond this level
// eslint-disable-next-line complexity
function tokenizeOpenedParenthesis (state) {
    state.nextSymbolCode = state.css.charCodeAt(state.pos + 1);
    const tokensCount = state.tokens.length;
    const prevTokenCssPart = tokensCount ? state.tokens[tokensCount - 1][1] : '';

    if (
        prevTokenCssPart === 'url' &&
        state.nextSymbolCode !== singleQuote &&
        state.nextSymbolCode !== doubleQuote &&
        state.nextSymbolCode !== space &&
        state.nextSymbolCode !== newline &&
        state.nextSymbolCode !== tab &&
        state.nextSymbolCode !== feed &&
        state.nextSymbolCode !== carriageReturn
    ) {
        state.nextPos = state.pos;

        do {
            state.escaped = false;
            state.nextPos = state.css.indexOf(')', state.nextPos + 1);

            if (state.nextPos === -1) {
                unclosed(state, 'bracket');
            }

            state.escapePos = state.nextPos;

            while (state.css.charCodeAt(state.escapePos - 1) === backslash) {
                state.escapePos -= 1;
                state.escaped = !state.escaped;
            }
        } while (state.escaped);

        state.tokens.push([
            'brackets', state.css.slice(state.pos, state.nextPos + 1),
            state.line, state.pos - state.offset,
            state.line, state.nextPos - state.offset
        ]);
        state.pos = state.nextPos;
    } else {
        state.nextPos = findClosedParenthesisPosition(state.css, state.length, state.pos);
        state.cssPart = state.css.slice(state.pos, state.nextPos + 1);

        const foundParam = state.cssPart.indexOf('@') >= 0;
        const foundString = /['"]/.test(state.cssPart);

        if (state.cssPart.length === 0 || state.cssPart === '...' || (foundParam && !foundString)) {
            // we're dealing with a mixin param block
            if (state.nextPos === -1) {
                unclosed(state, 'bracket');
            }

            state.tokens.push([
                state.symbol, state.symbol,
                state.line, state.pos - state.offset
            ]);
        } else {
            const badBracket = badBracketPattern.test(state.cssPart);

            if (state.nextPos === -1 || badBracket) {
                state.tokens.push([
                    state.symbol, state.symbol,
                    state.line, state.pos - state.offset
                ]);
            } else {
                state.tokens.push([
                    'brackets', state.cssPart,
                    state.line, state.pos - state.offset,
                    state.line, state.nextPos - state.offset
                ]);
                state.pos = state.nextPos;
            }
        }
    }
}

function tokenizeQuotes (state) {
    state.nextPos = state.pos;

    do {
        state.escaped = false;
        state.nextPos = state.css.indexOf(state.symbol, state.nextPos + 1);

        if (state.nextPos === -1) {
            unclosed(state, 'quote');
        }

        state.escapePos = state.nextPos;

        while (state.css.charCodeAt(state.escapePos - 1) === backslash) {
            state.escapePos -= 1;
            state.escaped = !state.escaped;
        }
    } while (state.escaped);

    state.tokens.push([
        'string', state.css.slice(state.pos, state.nextPos + 1),
        state.line, state.pos - state.offset,
        state.line, state.nextPos - state.offset
    ]);
    state.pos = state.nextPos;
}

function tokenizeAtRule (state) {
    if (state.css.charCodeAt(state.pos + 1) === openedCurlyBracket) {
        state.nextPos = state.css.indexOf('}', state.pos + 2);

        if (state.nextPos === -1) {
            unclosed(state, 'interpolation');
        }

        state.cssPart = state.css.slice(state.pos, state.nextPos + 1);
        state.lines = state.cssPart.split('\n');
        state.lastLine = state.lines.length - 1;

        if (state.lastLine > 0) {
            state.nextLine = state.line + state.lastLine;
            state.nextOffset = state.nextPos - state.lines[state.lastLine].length;
        } else {
            state.nextLine = state.line;
            state.nextOffset = state.offset;
        }

        state.tokens.push([
            'word', state.cssPart,
            state.line, state.pos - state.offset,
            state.nextLine, state.nextPos - state.nextOffset
        ]);

        state.offset = state.nextOffset;
        state.line = state.nextLine;
    } else {
        atEndPattern.lastIndex = state.pos + 1;
        atEndPattern.test(state.css);

        if (atEndPattern.lastIndex === 0) {
            state.nextPos = state.css.length - 1;
        } else {
            state.nextPos = atEndPattern.lastIndex - 2;
        }

        state.cssPart = state.css.slice(state.pos, state.nextPos + 1);
        state.token = 'at-word';

        // check if it's a variable
        if (variablePattern.test(state.cssPart)) {
            wordEndPattern.lastIndex = state.pos + 1;
            wordEndPattern.test(state.css);
            if (wordEndPattern.lastIndex === 0) {
                state.nextPos = state.css.length - 1;
            } else {
                state.nextPos = wordEndPattern.lastIndex - 2;
            }

            state.cssPart = state.css.slice(state.pos, state.nextPos + 1);
            state.token = 'word';
        } else {
            const nParenStart = state.tokens.findIndex((x) => x[0] === '(');
            const nParenEnd = state.tokens.findIndex((x) => x[0] === ')');

            if (nParenStart >= 0 && nParenEnd < 0) {
                state.token = 'mixin-param';
            }
        }

        state.tokens.push([
            state.token, state.cssPart,
            state.line, state.pos - state.offset,
            state.line, state.nextPos - state.offset
        ]);

        if (state.token === 'mixin-param') {
            const varDictPos = state.cssPart.indexOf('...');

            if (varDictPos >= 0 && varDictPos + 3 === state.cssPart.length) {
                state.tokens[state.tokens.length - 1].push('var-dict');
            }
        }
    }

    state.pos = state.nextPos;
}

function tokenizeBackslash (state) {
    state.nextPos = state.pos;
    state.escape = true;

    while (state.css.charCodeAt(state.nextPos + 1) === backslash) {
        state.nextPos += 1;
        state.escape = !state.escape;
    }

    state.symbolCode = state.css.charCodeAt(state.nextPos + 1);

    if (
        state.escape && (
        state.symbolCode !== slash &&
        state.symbolCode !== space &&
        state.symbolCode !== newline &&
        state.symbolCode !== tab &&
        state.symbolCode !== carriageReturn &&
        state.symbolCode !== feed)
    ) {
        state.nextPos += 1;
    }

    state.tokens.push([
        'word', state.css.slice(state.pos, state.nextPos + 1),
        state.line, state.pos - state.offset,
        state.line, state.nextPos - state.offset
    ]);

    state.pos = state.nextPos;
}

function tokenizeNestedExtend (state) {
    const end = findEndOfExpression(state.css, state.length, state.pos + nestedExtendWordLength);

    if (end !== -1) {
        state.tokens.push([
            'nested-extend', state.css.slice(state.pos, end + 1),
            state.line, state.pos - state.offset,
            state.nextLine, end - state.nextOffset
        ]);

        state.pos = end;
    }
}

function tokenizeMultilineComment (state) {
    state.nextPos = state.css.indexOf('*/', state.pos + 2) + 1;

    if (state.nextPos === 0) {
        unclosed(state, 'comment');
    }

    state.cssPart = state.css.slice(state.pos, state.nextPos + 1);
    state.lines = state.cssPart.split('\n');
    state.lastLine = state.lines.length - 1;

    if (state.lastLine > 0) {
        state.nextLine = state.line + state.lastLine;
        state.nextOffset = state.nextPos - state.lines[state.lastLine].length;
    } else {
        state.nextLine = state.line;
        state.nextOffset = state.offset;
    }

    state.tokens.push([
        'comment', state.cssPart,
        state.line, state.pos - state.offset,
        state.nextLine, state.nextPos - state.nextOffset
    ]);

    state.offset = state.nextOffset;
    state.line = state.nextLine;
    state.pos = state.nextPos;
}

function tokenizeInlineComment (state) {
    state.nextPos = state.css.indexOf('\n', state.pos + 2) - 1;

    if (state.nextPos === -2) {
        state.nextPos = state.css.length - 1;
    }

    state.tokens.push([
        'comment', state.css.slice(state.pos, state.nextPos + 1),
        state.line, state.pos - state.offset,
        state.line, state.nextPos - state.offset,
        'inline'
    ]);

    state.pos = state.nextPos;
}

// it is not very reasonable to reduce complexity beyond this level
// eslint-disable-next-line complexity
function tokenizeNestedMixin (state) {
    let openedParenthesisBlocks = 0;
    let openedCurlyBlocks = 0;
    let endLine = state.line;
    let endOffset = state.offset;

    for (let i = state.pos + 1; i < state.length; i++) {
        state.symbolCode = state.css.charCodeAt(i);
        endOffset++;

        if (
            !openedParenthesisBlocks && !openedCurlyBlocks &&
            (state.symbolCode === semicolon || state.symbolCode === closedCurlyBracket)
        ) {
            state.nextPos = i;

            // not including include '{' symbol
            if (state.symbolCode === closedCurlyBracket) {
                state.nextPos--;
            }

            state.cssPart = state.css.slice(state.pos, state.nextPos + 1);
            state.tokens.pop();
            state.tokens.push([
                'nested-mixin', state.cssPart,
                state.line, state.pos - state.offset,
                endLine, state.nextPos - endOffset
            ]);

            break;
        }

        switch (state.symbolCode) {
            case newline:
            {
                endLine++;
                endOffset = i;
                break;
            }

            case openedCurlyBracket:
            {
                // it's a CSS block -> exit from the loop
                if (!openedCurlyBlocks && !openedParenthesisBlocks) {
                    i = state.length;
                }

                openedCurlyBlocks++;
                break;
            }

            case closedCurlyBracket:
            {
                openedCurlyBlocks--;
                break;
            }

            case openedParenthesis:
            {
                openedParenthesisBlocks++;
                break;
            }

            case closedParenthesis:
            {
                openedParenthesisBlocks--;
                break;
            }

            default:
                break;
        }
    }
}

function tokenizeDefault (state) {
    // it's a nested &:extend
    if (
        state.symbolCode === ampersand &&
        state.css.slice(state.pos, state.pos + nestedExtendWordLength) === nestedExtendWord) {
        tokenizeNestedExtend(state);
    } else {
        state.nextSymbolCode = state.css.charCodeAt(state.pos + 1);

        if (state.symbolCode === slash && state.nextSymbolCode === asterisk) {
            tokenizeMultilineComment(state);
        } else if (state.symbolCode === slash && state.nextSymbolCode === slash) {
            tokenizeInlineComment(state);
        } else {
            if (isEscaping(state) === false) {
                wordEndPattern.lastIndex = state.pos + 1;
                wordEndPattern.test(state.css);
                if (wordEndPattern.lastIndex === 0) {
                    state.nextPos = state.css.length - 1;
                } else {
                    state.nextPos = wordEndPattern.lastIndex - 2;
                }
            }

            state.cssPart = state.css.slice(state.pos, state.nextPos + 1);

            const tokensCount = state.tokens.push([
                'word', state.cssPart,
                state.line, state.pos - state.offset,
                state.line, state.nextPos - state.offset
            ]);

            /**
             * - mark nested mixin by custom token 'nested-mixin'
             * - skip variables that start from dot (.5s) or from hash (#f3f3f3)
             */
            if (
                isMixinName(state.cssPart) &&
                ((state.tokens[tokensCount - 2] || [])[1] !== ':') &&
                ((state.tokens[tokensCount - 3] || [])[1] !== ':')
            ) {
                tokenizeNestedMixin(state);
            }

            state.pos = state.nextPos;
        }
    }
}

// we cannot reduce complexity beyond this level
// eslint-disable-next-line complexity
function tokenizeSymbol (state) {
    switch (state.symbolCode) {
        case newline:
        case space:
        case tab:
        case carriageReturn:
        case feed:
            tokenizeWhitespace(state);
            break;

        case comma:
            tokenizeComma(state);
            break;

        case colon:
        case semicolon:
        case openedCurlyBracket:
        case closedCurlyBracket:
        case closedParenthesis:
            tokenizeBasicSymbol(state);
            break;

        case openedParenthesis:
            tokenizeOpenedParenthesis(state);
            break;

        case singleQuote:
        case doubleQuote:
            tokenizeQuotes(state);
            break;

        case atRule:
            tokenizeAtRule(state);
            break;

        case backslash:
            tokenizeBackslash(state);
            break;

        default:
            tokenizeDefault(state);
            break;
    }
}

export default function lessTokenize (input) {
    const state = {
        input,
        tokens: [],
        css: input.css.valueOf(),
        offset: -1,
        line: 1,
        pos: 0
    };

    state.length = state.css.length;

    while (state.pos < state.length) {
        state.symbolCode = state.css.charCodeAt(state.pos);
        state.symbol = state.css[state.pos];
        state.nextSymbolCode = null;
        state.nextPos = null;
        state.escaped = null;
        state.lines = null;
        state.lastLine = null;
        state.cssPart = null;
        state.escape = null;
        state.nextLine = null;
        state.nextOffset = null;
        state.escapePos = null;
        state.token = null;

        if (state.symbolCode === newline) {
            state.offset = state.pos;
            state.line += 1;
        }

        tokenizeSymbol(state);

        state.pos++;
    }

    return state.tokens;
}
