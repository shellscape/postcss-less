import {backslash, carriageReturn, feed, newline, slash, space, tab} from './globals';

export default function tokenizeBackslash (state) {
    state.nextPos = state.pos;
    state.escape = true;

    while (state.css.charCodeAt(state.nextPos + 1) === backslash) {
        state.nextPos += 1;
        state.escape = !state.escape;
    }

    state.symbolCode = state.css.charCodeAt(state.nextPos + 1);

    if (
        state.escape && (
        state.symbolCode !== slash &&
        state.symbolCode !== space &&
        state.symbolCode !== newline &&
        state.symbolCode !== tab &&
        state.symbolCode !== carriageReturn &&
        state.symbolCode !== feed)
    ) {
        state.nextPos += 1;
    }

    state.tokens.push([
        'word', state.css.slice(state.pos, state.nextPos + 1),
        state.line, state.pos - state.offset,
        state.line, state.nextPos - state.offset
    ]);

    state.pos = state.nextPos;
}