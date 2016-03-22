import unclosed from './unclosed';

export default function tokenizeMultilineComment (state) {
    state.nextPos = state.css.indexOf('*/', state.pos + 2) + 1;

    if (state.nextPos === 0) {
        unclosed(state, 'comment');
    }

    state.cssPart = state.css.slice(state.pos, state.nextPos + 1);
    state.lines = state.cssPart.split('\n');
    state.lastLine = state.lines.length - 1;

    if (state.lastLine > 0) {
        state.nextLine = state.line + state.lastLine;
        state.nextOffset = state.nextPos - state.lines[state.lastLine].length;
    } else {
        state.nextLine = state.line;
        state.nextOffset = state.offset;
    }

    state.tokens.push([
        'comment', state.cssPart,
        state.line, state.pos - state.offset,
        state.nextLine, state.nextPos - state.nextOffset
    ]);

    state.offset = state.nextOffset;
    state.line = state.nextLine;
    state.pos = state.nextPos;
}