// chai uses expressions for validation
/* eslint no-unused-expressions: 0 */

import CssSyntaxError from 'postcss/lib/css-syntax-error';
import {expect} from 'chai';
import lessSyntax from '../lib/less-syntax';
import postcss from 'postcss';

describe('#postcss', () => {
    it('should process LESS syntax', (done) => {
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

    it('should parse LESS mixins as at rules', (done) => {
        const lessText = '.foo (@bar; @baz...) { border: @{baz}; }';

        postcss()
            .process(lessText, {syntax: lessSyntax})
            .then((result) => {
                expect(result).to.be.not.null;
                expect(result.css).to.equal(lessText);
                expect(result.content).to.equal(lessText);

                done();
            }).catch(done);
    });

    it('should not parse invalid LESS (#64)', (done) => {
        const lessText = '.foo';

        postcss()
            .process(lessText, {syntax: lessSyntax})
            .catch((err) => {
                expect(err).to.be.an.instanceof(CssSyntaxError);
                done();
            });
    });
});
