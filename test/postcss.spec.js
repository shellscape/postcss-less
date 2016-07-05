// chai uses expressions for validation
/* eslint no-unused-expressions: 0 */

import {expect} from 'chai';
import lessSyntax from '../lib/less-syntax';
import postcss from 'postcss';

describe('#postcss', () => {
    it('can process LESS syntax', (done) => {
        const lessText = 'a { b {} }';

        postcss()
            .process(lessText, {syntax: lessSyntax})
            .then((result) => {
                expect(result).to.be.not.null;
                expect(result.css).to.equal(lessText);
                expect(result.content).to.equal(lessText);

                done();
            }).catch(done);
    });

    it('can parse LESS mixins without body', (done) => {
        const lessText = `.test4 {
                            .mixin();
                            background: red;
                        }`;
        
        postcss()
            .process(lessText, {syntax: lessSyntax})
            .then((result) => {
                const [rule, declaration] = result.root.first.nodes;
                
                expect(rule.raws).to.deep.equal({
                    before: '\n                            ',
                    between: '',
                    after: '',
                    semicolon: true
                });

                expect(declaration.raws).to.deep.equal({
                    before: '\n                            ',
                    between: ': '
                });

                done();
            }).catch(done);
    });
});