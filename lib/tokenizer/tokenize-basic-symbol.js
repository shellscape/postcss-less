module.exports = (state) => {
  state.tokens.push([
    state.symbol, state.symbol,
    state.line, state.pos - state.offset
  ]);
};
