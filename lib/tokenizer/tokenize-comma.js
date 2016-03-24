export default function tokenizeComma (state) {
    state.tokens.push([
        'word', state.symbol,
        state.line, state.pos - state.offset,
        state.line, state.pos - state.offset + 1
    ]);
}