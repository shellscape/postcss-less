import {
    closedCurlyBracket,
    closedParenthesis,
    newline,
    openedCurlyBracket,
    openedParenthesis,
    semicolon
} from './globals';

// it is not very reasonable to reduce complexity beyond this level
// eslint-disable-next-line complexity
export default function tokenizeNestedMixin (state) {
    let openedParenthesesCount = 0;
    let closedParenthesesCount = 0;
    let unclosedCurlyBlocks = 0;
    let endLine = state.line;
    let endOffset = state.offset;

    for (let i = state.pos + 1; i < state.length; i++) {
        state.symbolCode = state.css.charCodeAt(i);
        endOffset++;

        if (
            openedParenthesesCount === closedParenthesesCount && !unclosedCurlyBlocks &&
            (state.symbolCode === semicolon || state.symbolCode === closedCurlyBracket)
        ) {
            state.nextPos = i;

            // not including symbol '}'
            if (state.symbolCode === closedCurlyBracket) {
                state.nextPos--;
            }

            state.cssPart = state.css.slice(state.pos, state.nextPos + 1);
            
            const tokenName = openedParenthesesCount ? 'mixin-function' : 'mixin-inline';
                        
            // we will replace the last token
            state.tokens.pop();
            state.tokens.push([
                tokenName, state.cssPart,
                state.line, state.pos - state.offset,
                endLine, state.nextPos - endOffset
            ]);

            break;
        }

        switch (state.symbolCode) {
            case newline:
            {
                endLine++;
                endOffset = i;
                break;
            }

            case openedCurlyBracket:
            {
                // it's an inner block -> exit from the loop
                if (!unclosedCurlyBlocks && openedParenthesesCount === closedParenthesesCount) {
                    i = state.length;
                }

                unclosedCurlyBlocks++;
                break;
            }

            case closedCurlyBracket:
            {
                unclosedCurlyBlocks--;
                break;
            }

            case openedParenthesis:
            {
                openedParenthesesCount++;
                break;
            }

            case closedParenthesis:
            {
                closedParenthesesCount++;
                break;
            }

            default:
                break;
        }
    }
}