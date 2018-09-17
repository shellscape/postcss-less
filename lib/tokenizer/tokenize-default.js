const {
  asterisk,
  slash,
  wordEndPattern
} = require('./globals');
const findEndOfEscaping = require('./find-end-of-escaping');
const isEscaping = require('./is-escaping');
const tokenizeInlineComment = require('./tokenize-inline-comment');
const tokenizeMultilineComment = require('./tokenize-multiline-comment');
const unclosed = require('./unclosed');

module.exports = (state) => {
  const nextSymbolCode = state.css.charCodeAt(state.pos + 1);

  if (state.symbolCode === slash && nextSymbolCode === asterisk) {
    tokenizeMultilineComment(state);
  }
  else if (state.symbolCode === slash && nextSymbolCode === slash) {
    tokenizeInlineComment(state);
  }
  else {
    if (isEscaping(state)) {
      const pos = findEndOfEscaping(state);

      if (pos < 0) {
        unclosed(state, 'escaping');
      }
      else {
        state.nextPos = pos;
      }
    }
    else {
      wordEndPattern.lastIndex = state.pos + 1;
      wordEndPattern.test(state.css);

      if (wordEndPattern.lastIndex === 0) {
        state.nextPos = state.css.length - 1;
      }
      else {
        state.nextPos = wordEndPattern.lastIndex - 2;
      }
    }

    state.cssPart = state.css.slice(state.pos, state.nextPos + 1);

    state.tokens.push([
      'word', state.cssPart,
      state.line, state.pos - state.offset,
      state.line, state.nextPos - state.offset
    ]);

    state.pos = state.nextPos;
  }
};
