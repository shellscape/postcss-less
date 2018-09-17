const { closedCurlyBracket, closedParenthesis, openedCurlyBracket, openedParenthesis, semicolon } = require('./globals');

module.exports =  function findEndOfExpression (css, length, i) {
  let openedParenthesisBlocks = 0,
    openedCurlyBlocks = 0;

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
};
