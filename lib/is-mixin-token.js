import {dot, hash, hashColorPattern} from './tokenizer/globals';

const unpaddedFractionalNumbersPattern = /\.[0-9]/;

export default function isMixinToken (token) {
    const symbol = token[1];
    const firstSymbolCode = symbol ? symbol[0].charCodeAt(0) : null;

    return (firstSymbolCode === dot || firstSymbolCode === hash) &&

            // ignore hashes used for colors
        hashColorPattern.test(symbol) === false &&

            // ignore dots used for unpadded fractional numbers
        unpaddedFractionalNumbersPattern.test(symbol) === false;
}