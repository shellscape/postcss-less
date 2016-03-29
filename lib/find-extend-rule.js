const extendRuleKeyWords = ['&', ':', 'extend'];
const extendRuleKeyWordsCount = extendRuleKeyWords.length;

export default function findExtendRule (tokens, start = 0) {
    const stack = [];
    const len = tokens.length;
    let end;

    for (end = start; end < len; end++) {
        const token = tokens[end];
        
        if (extendRuleKeyWords.indexOf(token[1]) >= 0) {
            stack.push(token[1]);
        } else if (token[0] !== 'space') {
            break;
        }        
    }
    
    for (let j = 0; j < extendRuleKeyWordsCount; j++) {
        if (stack[j] !== extendRuleKeyWords[j]) {
            return null;
        }
    } 
    
    
    return tokens.slice(start, end);
}