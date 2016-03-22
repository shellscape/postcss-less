import findEndOfExpression from './find-end-of-expression';
import {nestedExtendWordLength} from './globals';

export default function tokenizeNestedExtend (state) {
    const end = findEndOfExpression(state.css, state.length, state.pos + nestedExtendWordLength);

    if (end !== -1) {
        state.tokens.push([
            'nested-extend', state.css.slice(state.pos, end + 1),
            state.line, state.pos - state.offset,
            state.nextLine, end - state.nextOffset
        ]);

        state.pos = end;
    }
}