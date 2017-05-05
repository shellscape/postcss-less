// chai uses expressions for validation
/* eslint no-unused-expressions: 0 */

import cases from 'postcss-parser-tests';
import {expect} from 'chai';
import parse from './../lib/less-parse';
import postcss from 'postcss';
import postcssLess from './../lib/less-syntax';
import stringify from './../lib/less-stringify';

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

            expect(result).to.eql('// comment\na {}');
        });

        it('stringifies inline comment in the end of file', () => {
            const root = parse('// comment');
            let result = '';

            stringify(root, (i) => {
                result += i;
            });

            expect(result).to.eql('// comment');
        });
    });

    describe('Extend', () => {
        it('stringifies mixin without body. #1', (done) => {
            const less = '.selector:extend(.f, .g)  {&:extend(.a);}';

            postcss().process(less, {
                syntax: postcssLess,
                stringifier: stringify
            }).then((result) => {
                expect(result.content).to.eql(less);
                done();
            }).catch((error) => {
                done(error);
            });
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

        it('stringifies mixin without body. #1', (done) => {
            const less = '.mix() {color: red} .selector {.mix()}';

            postcss().process(less, {
                syntax: postcssLess,
                stringifier: stringify
            }).then((result) => {
                expect(result.content).to.eql(less);
                done();
            }).catch((error) => {
                done(error);
            });
        });

        it('stringifies mixin without body. #2', (done) => {
            const less = `
                .container {
                    .mixin-1();
                    .mixin-2;
                    .mixin-3 (@width: 100px) {
                        width: @width;
                    }
                }

                .rotation(@deg:5deg){
                  .transform(rotate(@deg));
                }
            `;

            postcss().process(less, {
                syntax: postcssLess,
                stringifier: stringify
            }).then((result) => {
                expect(result.content).to.eql(less);
                done();
            }).catch((error) => {
                done(error);
            });
        });
    });
});
