// chai uses expressions for validation

import cases from 'postcss-parser-tests';
import {expect} from 'chai';
import parse from '../../lib/less-parse';

describe('Parser', () => {
    describe('CSS for PostCSS', () => {
        cases.each((name, code, json) => {
          /* eslint no-console: 0 */
            /**
             * @description
             *  - Skip comments.css, because we have an extended Comment node
             */
            if (name === 'comments.css' || name === 'atrule-no-space.css' || name === 'inside.css') {
                return;
            }

            it(`parses ${ name }`, () => {
                const root = parse(code, {from: name});
                const parsed = cases.jsonify(root);

                expect(parsed).to.eql(json);
            });
        });

        it('parses nested rules', () => {
            const root = parse('a { b {} }');

            expect(root.first.first.selector).to.eql('b');
        });

        it('parses at-rules inside rules', () => {
            const root = parse('a { @media {} }');

            expect(root.first.first.name).to.eql('media');
        });
    });
});
