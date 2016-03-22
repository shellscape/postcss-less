import {dot, hash, hashColorPattern} from './globals';

const unpaddedFractionalNumbersPattern = /\.[0-9]/;

export default function isMixinName (str) {
    const firstSymbolCode = str ? str[0].charCodeAt(0) : null;

    return (firstSymbolCode === dot || firstSymbolCode === hash) &&

            // ignore hashes used for colors
        hashColorPattern.test(str) === false &&

            // ignore dots used for unpadded fractional numbers
        unpaddedFractionalNumbersPattern.test(str) === false;
}