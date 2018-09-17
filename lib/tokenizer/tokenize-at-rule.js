const {
  atEndPattern,
  openedCurlyBracket,
  pageSelectorPattern,
  variableSpaceColonPattern,
  variablePattern,
  wordEndPattern
} = require('./globals');
const unclosed = require('./unclosed');

module.exports = (state) => {
  // it's an interpolation
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
    }
    else {
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
  }
  else {
    atEndPattern.lastIndex = state.pos + 1;
    atEndPattern.test(state.css);

    if (atEndPattern.lastIndex === 0) {
      state.nextPos = state.css.length - 1;
    }
    else {
      // the first condition below is special for variable in less
      // some one may write code like `@testVar   :  #fff`
      // we should detect this kind of existence.
      const rest = state.css.slice(atEndPattern.lastIndex);
      const potentialPageRule = state.css.slice(state.pos, atEndPattern.lastIndex + 1);

      // we have to handle special selector like `@page :left`
      if (variableSpaceColonPattern.test(rest) && !pageSelectorPattern.test(potentialPageRule)) {
        state.nextPos = atEndPattern.lastIndex + rest.search(':');
      }
      else {
        state.nextPos = atEndPattern.lastIndex - 2;
      }
    }

    state.cssPart = state.css.slice(state.pos, state.nextPos + 1);
    state.token = 'at-word';

    // check if it's a variable
    if (variablePattern.test(state.cssPart)) {
      wordEndPattern.lastIndex = state.pos + 1;
      wordEndPattern.test(state.css);
      if (wordEndPattern.lastIndex === 0) {
        state.nextPos = state.css.length - 1;
      }
      else {
        state.nextPos = wordEndPattern.lastIndex - 2;
      }

      state.cssPart = state.css.slice(state.pos, state.nextPos + 1);
      state.token = 'word';
    }

    state.tokens.push([
      state.token, state.cssPart,
      state.line, state.pos - state.offset,
      state.line, state.nextPos - state.offset
    ]);
  }

  state.pos = state.nextPos;
};
