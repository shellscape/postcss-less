const {
  atRule,
  backslash,
  carriageReturn,
  closedCurlyBracket,
  closedParenthesis,
  closeSquareBracket,
  colon,
  comma,
  doubleQuote,
  feed,
  newline,
  openedCurlyBracket,
  openedParenthesis,
  openSquareBracket,
  semicolon,
  singleQuote,
  space,
  tab
} = require('./globals');

const tokenizeAtRule = require('./tokenize-at-rule');
const tokenizeBackslash = require('./tokenize-backslash');
const tokenizeBasicSymbol = require('./tokenize-basic-symbol');
const tokenizeComma = require('./tokenize-comma');
const tokenizeDefault = require('./tokenize-default');
const tokenizeOpenedParenthesis = require('./tokenize-opened-parenthesis');
const tokenizeQuotes = require('./tokenize-quotes');
const tokenizeWhitespace = require('./tokenize-whitespace');

// we cannot reduce complexity beyond this level
// eslint-disable-next-line complexity
module.exports = function tokenizeSymbol (state) {
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
    case openSquareBracket:
    case closeSquareBracket:
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
};
