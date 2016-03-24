import {carriageReturn, feed, newline, space, tab} from './globals';

export default function tokenizeWhitespace (state) {
    state.nextPos = state.pos;

    // collect all neighbour space symbols
    do {
        state.nextPos += 1;
        state.symbolCode = state.css.charCodeAt(state.nextPos);
        if (state.symbolCode === newline) {
            state.offset = state.nextPos;
            state.line += 1;
        }
    } while (
        state.symbolCode === space ||
        state.symbolCode === newline ||
        state.symbolCode === tab ||
        state.symbolCode === carriageReturn ||
        state.symbolCode === feed
    );

    state.tokens.push(['space', state.css.slice(state.pos, state.nextPos)]);
    state.pos = state.nextPos - 1;
}