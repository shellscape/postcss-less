const { backslash, newline } = require('./globals');
const unclosed = require('./unclosed');

module.exports = function tokenizeQuotes (state) {
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

  const content = state.css.slice(state.pos, state.nextPos + 1);
  const lines = content.split('\n');
  const last = lines.length - 1;
  let nextLine,
    nextOffset;

  if ( last > 0 ) {
    nextLine = state.line + last;
    nextOffset = state.nextPos - lines[last].length;
  }
  else {
    nextLine = state.line;
    nextOffset = state.offset;
  }

  state.tokens.push([
    'string', content,
    state.line, state.pos - state.offset,
    nextLine, state.nextPos - state.offset
  ]);

  state.pos = state.nextPos;
};
