import {
    atRule,
    backslash,
    carriageReturn,
    closedCurlyBracket,
    closedParenthesis,
    colon,
    comma,
    doubleQuote,
    feed,
    newline,
    openedCurlyBracket,
    openedParenthesis,
    semicolon,
    singleQuote,
    space,
    tab
} from './globals';

import tokenizeAtRule from './tokenize-at-rule';
import tokenizeBackslash from './tokenize-backslash';
import tokenizeBasicSymbol from './tokenize-basic-symbol';
import tokenizeComma from './tokenize-comma';
import tokenizeDefault from './tokenize-default';
import tokenizeOpenedParenthesis from './tokenize-opened-parenthesis';
import tokenizeQuotes from './tokenize-quotes';
import tokenizeWhitespace from './tokenize-whitespace';

// we cannot reduce complexity beyond this level
// eslint-disable-next-line complexity
export default function tokenizeSymbol (state) {
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