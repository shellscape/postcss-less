import findEndOfExpression from './find-end-of-expression';
import {tilde} from './globals';

export default function isEscaping (state) {
    let result = false;

    if (state.symbolCode === tilde) {
        const quotePattern = /\s*['"`]/g;

        quotePattern.lastIndex = state.pos + 1;

        const match = quotePattern.exec(state.css);

        if (match && match.index === state.pos + 1) {
            const end = findEndOfExpression(state.css, state.length, quotePattern.lastIndex + 1);

            if (end !== -1) {
                result = true;
                state.nextPos = end;
            }
        }
    }

    return result;
}