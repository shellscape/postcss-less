// chai uses expressions for validation
/* eslint no-unused-expressions: 0 */

import {expect} from 'chai';
import parse from '../../lib/less-parse';

describe('Parser', () => {
    describe('Mixins', () => {
        it('parses basic mixins', () => {
            const root = parse('.foo (@bar; @baz...) { border: @{baz}; }');

            expect(root.first.type).to.eql('mixin');
            expect(root.first.selector).to.eql('.foo (@bar; @baz...)');
            expect(root.first.params[0].name).to.eql('bar');
            expect(root.first.params[1].name).to.eql('baz...');
            expect(root.first.params[1].variableDict).to.be.true;
            expect(root.first.first.prop).to.eql('border');
            expect(root.first.first.value).to.eql('@{baz}');
        });

        describe('Nested mixin', () => {
            /* eslint-disable no-multiple-empty-lines */
            it('parses nested mixins with class and id selectors', () => {
                const code = `
          .mixin-class {
            .a();
          }
          .mixin-id {
            #b();
          }

          .class {
            .mixin1 (


            )


            ;

            .mixin2
          }
        `;

                const root = parse(code);
                const rules = ['.mixin-class', '.mixin-id', '.class'];

                rules.forEach((selector, i) => {
                    expect(root.nodes[i].selector).to.eql(selector);
                    expect(root.nodes[i].nodes.length).to.eql(0);
                });
            });
            /* eslint-enable no-multiple-empty-lines */

            it('parses non-outputting mixins', () => {
                const code = `
          .class {
            .my-mixin;
            .my-other-mixin;
          }
        `;

                const root = parse(code);

                expect(root.first.selector).to.eql('.class');
                expect(root.first.nodes.length).to.eql(0);
            });

            it('parses nested mixins with namespaces', () => {
                const code = `
          .c {
            #outer > .inner;
            #space > .importer-1();
          }
        `;

                const root = parse(code);

                expect(root.first.selector).to.eql('.c');
                expect(root.first.nodes.length).to.eql(0);
            });

            it('parses nested mixins with guarded namespaces', () => {
                const code = `
          #namespace when (@mode=huge) {
            .mixin() { /* */ }
          }

          #namespace {
            .mixin() when (@mode=huge) { /* */ }
          }
        `;

                const root = parse(code);

                expect(root.nodes[1].first.selector).to.eql('.mixin() when (@mode=huge)');
            });

            it('parses nested mixins with `!important`', () => {
                const code = `
          .unimportant {
            .foo();
          }
          .important {
            .foo() !important;
          }
        `;

                const root = parse(code);
                const rules = ['.unimportant', '.important'];

                rules.forEach((selector, i) => {
                    expect(root.nodes[i].selector).to.eql(selector);
                    expect(root.nodes[i].nodes.length).to.eql(0);
                });
            });

            it('parses nested mixins with params', () => {
                const code = `
          .class1 {
            .mixin(@margin: 20px; @color: #33acfe);
          }

          .class2 {
            .mixin(#efca44; @padding: 40px);
          }

          .class3 {
            .name(1, 2, 3; something, else);
          }

          .class4 {
            .name(1, 2, 3)
          }

          .class5 {
            .name(1, 2, 3;)
          }

          .class6 {
            .name(@param1: red, blue;)
          }

          .class7 {
            .mixin(@margin: 20px; @color: #33acfe);
          }

          .class8 {
            .mixin(#efca44; @padding: 40px);
          }

          .class9 {
            .mixin(@switch; #888);
          }
        `;

                const root = parse(code);
                const rules = [
                    '.class1',
                    '.class2',
                    '.class3',
                    '.class4',
                    '.class5',
                    '.class6',
                    '.class7',
                    '.class8',
                    '.class9'
                ];

                rules.forEach((selector, i) => {
                    expect(root.nodes[i].selector).to.eql(selector);
                    expect(root.nodes[i].nodes.length).to.eql(0);
                });
            });

            it('parses nested mixins with the rule set', () => {
                const code = `
          header {
            .desktop-and-old-ie({
            background-color: red;
            });
          }
        `;

                const root = parse(code);

                expect(root.first.selector).to.eql('header');
                expect(root.first.nodes.length).to.eql(0);
            });

            it('parses nested mixins in global scope', () => {
                const code = `
          .mixin;
          .mixin2();
        `;

                const root = parse(code);

                expect(root.nodes.length).to.eql(0);
            });
        });
    });
});
