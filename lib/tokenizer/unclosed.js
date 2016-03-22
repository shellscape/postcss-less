export default function unclosed (state, what) {
    throw state.input.error(`Unclosed ${ what }`, state.line, state.pos - state.offset);
}