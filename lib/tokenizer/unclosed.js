module.exports = (state, what) => {
  throw state.input.error(`Unclosed ${ what }`, state.line, state.pos - state.offset);
};
