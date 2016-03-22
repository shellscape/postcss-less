import {newline} from './tokenizer/globals';
import tokenizeSymbol from './tokenizer/tokenize-symbol';

export default function lessTokenize (input) {
    const state = {
        input,
        tokens: [],
        css: input.css.valueOf(),
        offset: -1,
        line: 1,
        pos: 0
    };

    state.length = state.css.length;

    while (state.pos < state.length) {
        state.symbolCode = state.css.charCodeAt(state.pos);
        state.symbol = state.css[state.pos];
        state.nextSymbolCode = null;
        state.nextPos = null;
        state.escaped = null;
        state.lines = null;
        state.lastLine = null;
        state.cssPart = null;
        state.escape = null;
        state.nextLine = null;
        state.nextOffset = null;
        state.escapePos = null;
        state.token = null;

        if (state.symbolCode === newline) {
            state.offset = state.pos;
            state.line += 1;
        }

        tokenizeSymbol(state);

        state.pos++;
    }

    return state.tokens;
}
