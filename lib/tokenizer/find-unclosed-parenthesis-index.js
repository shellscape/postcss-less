export default function findUnclosedParenthesisIndex (state) {
    let openedParenthesesCount = 0;
    let i = state.tokens.length;

    while (i--) {
        const tokenName = state.tokens[i][0];

        if (tokenName === '(') {
            openedParenthesesCount++;
        } else if (tokenName === ')') {
            openedParenthesesCount--;
        }

        if (openedParenthesesCount > 0) {
            return i;
        }
    }
    
    return -1;
}