export default function tokenizeBasicSymbol (state) {
    state.tokens.push([
        state.symbol, state.symbol,
        state.line, state.pos - state.offset
    ]);
}