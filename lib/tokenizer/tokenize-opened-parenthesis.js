import {
    backslash,
    badBracketPattern,
    carriageReturn,
    doubleQuote,
    feed,
    newline,
    singleQuote,
    space,
    tab
} from './globals';
import unclosed from './unclosed';

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

// it is not very reasonable to reduce complexity beyond this level
// eslint-disable-next-line complexity
export default function tokenizeOpenedParenthesis (state) {
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