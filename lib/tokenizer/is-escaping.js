const { backTick, doubleQuote, singleQuote, tilde } = require('./globals');

const nextSymbolVariants = [backTick, doubleQuote, singleQuote];

module.exports = function isEscaping (state) {
  const nextSymbolCode = state.css.charCodeAt(state.pos + 1);

  return state.symbolCode === tilde && nextSymbolVariants.indexOf(nextSymbolCode) >= 0;
};
