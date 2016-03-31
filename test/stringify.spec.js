// chai uses expressions for validation
/* eslint no-unused-expressions: 0 */

import cases from 'postcss-parser-tests';
import {expect} from 'chai';
import parse from '../lib/less-parse';
import stringify from '../lib/less-stringify';

describe('#stringify()', () => {
    describe('CSS for PostCSS', () => {
        cases.each((name, css) => {
            if (name === 'bom.css') {
                return;
            }

            it(`stringifies ${ name }`, () => {
                const root = parse(css);
                let result = '';

                stringify(root, (i) => {
                    result += i;
                });

                expect(result).to.eql(css);
            });
        });
    });

    describe('Comments', () => {
        it('stringifies inline comment', () => {
            const root = parse('// comment\na {}');
            let result = '';

            stringify(root, (i) => {
                result += i;
            });

            expect(result).to.eql('// comment \na {}');
        });

        it('stringifies inline comment in the end of file', () => {
            const root = parse('// comment');
            let result = '';

            stringify(root, (i) => {
                result += i;
            });

            expect(result).to.eql('// comment ');
        });
    });
    
    describe('Mixins', () => {
        it('stringifies mixins', () => {
            const root = parse('.foo (@bar; @baz...) { border: @{baz}; }');
            let result = '';
            
            stringify(root, (i) => {
                result += i;
            });

            expect(result).to.eql('.foo (@bar; @baz...) { border: @{baz}; }');
        });
    });
});
