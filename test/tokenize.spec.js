import tokenize from '../lib/less-tokenize';
import {expect} from 'chai';
import Input from 'postcss/lib/input';

function testTokens (css, tokens) {
    expect(tokenize(new Input(css))).to.eql(tokens);
}

describe('Tokenizer', () => {
    describe('Comments', () => {
        it('tokenizes inline comments', () => {
            testTokens('// a\n', [['comment', '// a', 1, 1, 1, 4, 'inline'], ['space', '\n']]);
        });

        it('tokenizes inline comments in end of file', () => {
            testTokens('// a', [['comment', '// a', 1, 1, 1, 4, 'inline']]);
        });
    });

    describe('Variables', () => {
        it('tokenizes interpolation', () => {
            testTokens('@{a\nb}', [['word', '@{a\nb}', 1, 1, 2, 2]]);
        });
    });
});