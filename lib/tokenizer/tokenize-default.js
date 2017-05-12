import {
    asterisk,
    slash,
    wordEndPattern
} from './globals';
import findEndOfEscaping from './find-end-of-escaping';
import isEscaping from './is-escaping';
import tokenizeInlineComment from './tokenize-inline-comment';
import tokenizeMultilineComment from './tokenize-multiline-comment';
import unclosed from './unclosed';

export default function tokenizeDefault (state) {
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
}
