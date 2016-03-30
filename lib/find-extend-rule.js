const extendRuleKeyWords = ['&', ':', 'extend'];
const extendRuleKeyWordsCount = extendRuleKeyWords.length;

export default function findExtendRule (tokens, start = 0) {
    const stack = [];
    const len = tokens.length;
    let end = start;

    while (end < len) {
        const token = tokens[end];

        if (extendRuleKeyWords.indexOf(token[1]) >= 0) {
            stack.push(token[1]);
        } else if (token[0] !== 'space') {
            break;
        }

        end++;
    }

    for (let index = 0; index < extendRuleKeyWordsCount; index++) {
        if (stack[index] !== extendRuleKeyWords[index]) {
            return null;
        }
    }

    return tokens.slice(start, end);
}