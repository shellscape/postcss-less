import {backslash} from './globals';
import unclosed from './unclosed';

export default function tokenizeQuotes (state) {
    state.nextPos = state.pos;

    do {
        state.escaped = false;
        state.nextPos = state.css.indexOf(state.symbol, state.nextPos + 1);

        if (state.nextPos === -1) {
            unclosed(state, 'quote');
        }

        state.escapePos = state.nextPos;

        while (state.css.charCodeAt(state.escapePos - 1) === backslash) {
            state.escapePos -= 1;
            state.escaped = !state.escaped;
        }
    } while (state.escaped);

    state.tokens.push([
        'string', state.css.slice(state.pos, state.nextPos + 1),
        state.line, state.pos - state.offset,
        state.line, state.nextPos - state.offset
    ]);
    state.pos = state.nextPos;
}