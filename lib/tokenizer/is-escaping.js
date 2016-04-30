import {backTick, doubleQuote, singleQuote, tilde} from './globals';

const nextSymbolVariants = [backTick, doubleQuote, singleQuote];

export default function isEscaping (state) {
    const nextSymbolCode = state.css.charCodeAt(state.pos + 1);

    return state.symbolCode === tilde && nextSymbolVariants.indexOf(nextSymbolCode) >= 0;
}