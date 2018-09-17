const { backTick, backslash, doubleQuote, singleQuote } = require('./globals');

/**
 * @param state
 * @returns {number}
 */
module.exports = (state) => {
  let openQuotesCount = 0,
    quoteCode = -1;

  for (let i = state.pos + 1; i < state.length; i++) {
    const symbolCode = state.css.charCodeAt(i);
    const prevSymbolCode = state.css.charCodeAt(i - 1);

    if (prevSymbolCode !== backslash &&
      (symbolCode === singleQuote || symbolCode === doubleQuote || symbolCode === backTick)
    ) {
      if (quoteCode === -1) {
        quoteCode = symbolCode;
        openQuotesCount++;
      }
      else if (symbolCode === quoteCode) {
        openQuotesCount--;

        if (!openQuotesCount) {
          return i;
        }
      }
    }
  }

  return -1;
};
