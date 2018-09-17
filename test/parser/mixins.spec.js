// chai uses expressions for validation
/* eslint no-unused-expressions: 0 */

import { expect } from 'chai';
import parse from '../../lib/less-parse';

describe('Parser', () => {
  describe('Mixins', () => {
    it('parses basic mixins', () => {
      const params = '(  1, 2, 3; something, else; ...) when (@mode=huge)';
      const selector = `.foo ${ params }`;
      const root = parse(`${ selector } { border: @{baz}; }`);

      expect(root.first.type, 'rule', 'Basic mixin. Invalid node type');
      expect(root.first.selector, selector, 'Basic mixin. Invalid selector');
      expect(root.first.params, params, 'Basic mixin. Invalid params');
      expect(root.first.first.prop, 'border');
      expect(root.first.first.value, '@{baz}');
    });

    describe('Mixins without body', () => {
      it('mixin without body #1', () => {
        const less = '.mixin-name (#FFF);';
        const root = parse(less);

        expect(root.first.type, 'rule');
        expect(root.first.selector, '.mixin-name (#FFF)');
        expect(root.first.params, '(#FFF)');
        expect(root.first.empty, true);
        expect(root.first.nodes).to.be.an('undefined');
        expect(root.first.toString()).to.be.eql('.mixin-name (#FFF);');
      });

      it('mixin without body #2', () => {
        const root = parse('.base { .mixin-name }');

        expect(root.first.first.type, 'rule');
        expect(root.first.first.selector, '.mixin-name');
        expect(root.first.params).to.be.undefined;
        expect(root.first.first.empty, true);
        expect(root.first.first.nodes).to.be.undefined;
      });

      it('mixin without body and without whitespace #2', () => {
        const root = parse('.base {.mixin-name}');

        expect(root.first.first.type, 'rule');
        expect(root.first.first.selector, '.mixin-name');
        expect(root.first.params).to.be.undefined;
        expect(root.first.first.empty, true);
        expect(root.first.first.nodes).to.be.undefined;
      });
    });

    describe('Nested mixin', () => {
      /* eslint-disable no-multiple-empty-lines */
      it('parses nested mixins with class and id selectors', () => {
        const code = `
                    .mixin-class {
                        .a(#FFF);
                    }
                    .mixin-id {
                        #b (@param1; @param2);
                    }

                    .class {
                        .mixin1 (


                        )


                        ;

                        .mixin2
                    }
                `;

        const root = parse(code);

        expect(root.nodes[0].first.selector, '.a(#FFF)', '.a: invalid selector');
        expect(root.nodes[0].first.params, '(#FFF)', '.a: invalid params');

        expect(root.nodes[1].first.selector, '#b (@param1; @param2)', '#b: invalid selector');
        expect(root.nodes[1].first.params, '(@param1; @param2)', '#b: invalid params');

        expect(/\.mixin1\s\(\s+\)/.test(root.nodes[2].nodes[0].selector),
          true,
          '.mixin1: invalid selector'
        );
        expect(/\(\s+\)/.test(root.nodes[2].nodes[0].params), true, '.mixin1: invalid params');

        expect(root.nodes[2].nodes[1].selector, '.mixin2', '.mixin2: invalid selector');
        expect(root.nodes[2].nodes[1].params).to.be.an('undefined', '.mixin2: invalid params');
      });

      it('parses nested mixins with namespaces', () => {
        const code = `
                    .c {
                        #outer > .inner;
                        #space > .importer-1();
                    }
                `;

        const root = parse(code);

        expect(root.first.selector, '.c');
        expect(root.first.nodes.length, 2);
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

        expect(root.nodes[0].first.selector, '.mixin()');
        expect(root.nodes[1].first.selector, '.mixin() when (@mode=huge)');
      });

      it('parses nested mixins with `!important`', () => {
        const code = `
                    .foo() !important;
                `;

        const root = parse(code);

        expect(root.first.selector, '.foo()');
        expect(root.first.important, true);
      });

      it('parses nested mixins with `!important` - insensitive to casing', () => {
        const code = `
                    .foo() !IMPoRTant;
                `;

        const root = parse(code);

        expect(root.first.selector, '.foo()');
        expect(root.first.important, true);
      });

      it('parses nested mixins with `!important` - appended without whitespace', () => {
        const code = `
                    .foo()!important;
                `;

        const root = parse(code);

        expect(root.first.selector, '.foo()');
        expect(root.first.important, true);
      });

      it('parses nested mixins with `! important`', () => {
        const code = `
                    .foo() ! important;
                    .bar()! important;
                `;

        const root = parse(code);

        expect(root.first.selector, '.foo()');
        expect(root.first.important, true);
        expect(root.first.raws.important, ' ! important');

        expect(root.last.selector, '.bar()');
        expect(root.last.important, true);
        expect(root.last.raws.important, '! important');
      });

      it('parses nested mixins with the rule set', () => {
        const params = '({background-color: red;})';
        const ruleSet = `.desktop-and-old-ie ${ params }`;
        const root = parse(`header { ${ ruleSet }; }`);

        expect(root.first.selector, 'header');
        expect(root.first.first.selector, ruleSet);
        expect(root.first.first.params, params, 'Mixin rule set. Invalid params');
        expect(root.first.first.empty, true);
        expect(root.first.first.nodes).to.be.an('undefined');
      });

      it('should parse nested mixin', () => {
        const code = `
                    .badge-quality {
                        &:extend(.label, .m_text-uppercase);
                        font-size: 85%;
                        font-weight: normal;
                        min-width: 2rem;
                        height: 2rem;
                        padding: 0.2rem 0.3rem;
                        display: inline-block;
                        border-radius: 0;
                        cursor: default;
                        line-height: 1.6rem;
                        color: @c_white;
                        background-color: @c_blue1;

                        &_info {
                            background-color: @c_blue5;
                        }

                        &_danger {
                            background-color: @c_red2;
                        }

                        &_success {
                            background-color: @c_green3;
                        }

                        &_warning {
                            background-color: @c_yellow1;
                            color: @c_black1;
                        }
                    }

                    .badge-category {
                        &:extend(.m_badge-default);
                    }

                    .buy-sell-badge {
                        .m_text-uppercase();

                        &_buy {
                            &:extend(.m_text-success);
                        }

                        &_sell {
                            &:extend(.m_text-error);
                        }
                    }
                `;

        const root = parse(code);

        expect(root.nodes.length, 3);
      });
    });
  });
});
