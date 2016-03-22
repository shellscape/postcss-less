import {
    ampersand,
    asterisk,
    nestedExtendWord,
    nestedExtendWordLength,
    slash,
    wordEndPattern
} from './globals';
import isEscaping from './is-escaping';
import isMixinName from './is-mixin-name';
import tokenizeInlineComment from './tokenize-inline-comment';
import tokenizeMultilineComment from './tokenize-multiline-comment';
import tokenizeNestedExtend from './tokenize-nested-extend';
import tokenizeNestedMixin from './tokenize-nested-mixin';

export default function tokenizeDefault (state) {
    // it's a nested &:extend
    if (
        state.symbolCode === ampersand &&
        state.css.slice(state.pos, state.pos + nestedExtendWordLength) === nestedExtendWord) {
        tokenizeNestedExtend(state);
    } else {
        state.nextSymbolCode = state.css.charCodeAt(state.pos + 1);

        if (state.symbolCode === slash && state.nextSymbolCode === asterisk) {
            tokenizeMultilineComment(state);
        } else if (state.symbolCode === slash && state.nextSymbolCode === slash) {
            tokenizeInlineComment(state);
        } else {
            if (isEscaping(state) === false) {
                wordEndPattern.lastIndex = state.pos + 1;
                wordEndPattern.test(state.css);
                if (wordEndPattern.lastIndex === 0) {
                    state.nextPos = state.css.length - 1;
                } else {
                    state.nextPos = wordEndPattern.lastIndex - 2;
                }
            }

            state.cssPart = state.css.slice(state.pos, state.nextPos + 1);

            const tokensCount = state.tokens.push([
                'word', state.cssPart,
                state.line, state.pos - state.offset,
                state.line, state.nextPos - state.offset
            ]);

            /**
             * - mark nested mixin by custom token
             * - skip variables that start from dot (.5s) or from hash (#f3f3f3)
             */
            if (
                isMixinName(state.cssPart) &&
                ((state.tokens[tokensCount - 2] || [])[1] !== ':') &&
                ((state.tokens[tokensCount - 3] || [])[1] !== ':')
            ) {
                tokenizeNestedMixin(state);
            }

            state.pos = state.nextPos;
        }
    }
}