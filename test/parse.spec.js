// chai uses expressions for validation
/* eslint no-unused-expressions: 0 */

import cases from 'postcss-parser-tests';
import { expect } from 'chai';
import parse from '../lib/less-parse';

describe('#parse()', () => {
  describe('CSS for PostCSS', () => {
    cases.each((name, code, json) => {
      it(`parses ${ name }`, () => {
        const root = parse(code, { from: name });
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

  describe('Variables', () => {
    it('parses numeric variables', () => {
      const root = parse('@var: 1;');

      expect(root.first.prop).to.eql('@var');
      expect(root.first.value).to.eql('1');
    });

    it('parses string variables', () => {
      const root = parse('@var: "test";');

      expect(root.first.prop).to.eql('@var');
      expect(root.first.value).to.eql('"test"');
    });

    it('parses color (hash) variables', () => {
      const root = parse('@var: #fff;');

      expect(root.first.prop).to.eql('@var');
      expect(root.first.value).to.eql('#fff');
    });

    it('parses interpolation', () => {
      const root = parse('@{selector}:hover { @{prop}-size: @{color} }');

      expect(root.first.selector).to.eql('@{selector}:hover');
      expect(root.first.first.prop).to.eql('@{prop}-size');
      expect(root.first.first.value).to.eql('@{color}');
    });

    it('parses interpolation inside word', () => {
      const root = parse('.@{class} {}');

      expect(root.first.selector).to.eql('.@{class}');
    });

    it('parses interpolation inside word', () => {
      const root = parse('.@{class} {}');

      expect(root.first.selector).to.eql('.@{class}');
    });

    it('parses escaping', () => {
      const code = `
      .m_transition (...) {
        @props: ~\`"@{arguments}".replace(/[\[\]]/g, '')\`;
        @var: ~ a;
        -webkit-transition: @props;
        -moz-transition: @props;
        -o-transition: @props;
        transition: @props;
      }

      .a {
        & ~ .stock-bar__content .stock-bar__control_pause {
        display: none;
        }
      }
      `;

      const root = parse(code);

      expect(root.first.selector).to.eql('.m_transition (...)');
      expect(root.first.first.prop).to.eql('@props');
      expect(root.first.first.value).to.eql('~`"@{arguments}".replace(/[\[\]]/g, \'\')`');
      expect(root.nodes[1].first.selector).to.eql('& ~ .stock-bar__content .stock-bar__control_pause');
    });
  });

  describe('Comments', () => {
    it('parses inline comments', () => {
      const root = parse('\n// a \n/* b */');

      expect(root.nodes).to.have.length(2);
      expect(root.first.text).to.eql('a');
      expect(root.first.raws).to.eql({
        before: '\n',
        left: ' ',
        right: ' ',
        inline: true,
      });
      expect(root.last.text).to.eql('b');
    });

    it('parses empty inline comments', () => {
      const root = parse('//\n// ');

      expect(root.first.text).to.eql('');
      expect(root.first.raws).to.eql({
        before: '',
        left: '',
        right: '',
        inline: true,
      });
      expect(root.last.text).to.eql('');
      expect(root.last.raws).to.eql({
        before: '\n',
        left: ' ',
        right: '',
        inline: true,
      });
    });

    it('does not parse comments inside brackets', () => {
      const root = parse('a { cursor: url(http://site.com) }');

      expect(root.first.first.value).to.eql('url(http://site.com)');
    });
  });

  describe('Extend', () => {
    it('parses inline &:extend()', () => {
      const code = '.a:extend(.b) {color: red;}';
      const root = parse(code);

      expect(root.first.selector).to.eql('.a:extend(.b)');
    });

    it('parses inline &:extend() with multiple parameters', () => {
      const code = '.e:extend(.f, .g) {}';
      const root = parse(code);

      expect(root.first.selector).to.eql('.e:extend(.f, .g)');
    });

    it('parses inline &:extend() with nested selector in parameters', () => {
      const code = '.e:extend(.a .g, b span) {}';
      const root = parse(code);

      expect(root.first.selector).to.eql('.e:extend(.a .g, b span)');
    });

    it('parses nested &:extend()', () => {
      const code = '.a {\n&:extend(.b);\n}';
      const root = parse(code);

      expect(root.first.selector).to.eql('.a');
      expect(root.first.nodes.length).to.eql(0);
    });

    it('parses :extend() after selector', () => {
      const code = 'pre:hover:extend(div pre){}';
      const root = parse(code);

      expect(root.first.selector).to.eql('pre:hover:extend(div pre)');
    });

    it('parses :extend() after selector. 2', () => {
      const code = 'pre:hover :extend(div pre){}';
      const root = parse(code);

      expect(root.first.selector).to.eql('pre:hover :extend(div pre)');
    });

    it('parses multiple extends', () => {
      const code = 'pre:hover:extend(div pre):extend(.bucket tr) { }';
      const root = parse(code);

      expect(root.first.selector).to.eql('pre:hover:extend(div pre):extend(.bucket tr)');
    });

    it('parses nth expression in extend', () => {
      const code = ':nth-child(1n+3) {color: blue;} .child:extend(:nth-child(n+3)) {}';
      const root = parse(code);

      expect(root.first.selector).to.eql(':nth-child(1n+3)');
      expect(root.nodes[1].selector).to.eql('.child:extend(:nth-child(n+3))');
    });

    it('parses extend "all"', () => {
      const code = '.replacement:extend(.test all) {}';
      const root = parse(code);

      expect(root.first.selector).to.eql('.replacement:extend(.test all)');
    });

    it('parses extend with interpolation', () => {
      const code = '.bucket {color: blue;}\n.some-class:extend(@{variable}) {}\n@variable: .bucket;';
      const root = parse(code);

      expect(root.nodes[0].selector).to.eql('.bucket');
      expect(root.nodes[1].selector).to.eql('.some-class:extend(@{variable})');
    });
  });

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
        const rules = [ '.mixin-class', '.mixin-id', '.class' ];

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
        const rules = [ '.unimportant', '.important' ];

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
          '.class9',
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

  describe('Interpolation', () => {
    it('parses interpolation', () => {
      const root = parse('@{selector}:hover { @{prop}-size: @{color} }');

      expect(root.first.selector).to.eql('@{selector}:hover');
      expect(root.first.first.prop).to.eql('@{prop}-size');
      expect(root.first.first.value).to.eql('@{color}');
    });

    it('parses mixin interpolation', () => {
      const less = '.browser-prefix(@prop, @args) {\n @{prop}: @args;\n}';
      const root = parse(less);

      expect(root.first.selector).to.eql('.browser-prefix(@prop, @args)');
      expect(root.first.first.prop).to.eql('@{prop}');
      expect(root.first.first.value).to.eql('@args');
    });

    it('parses interpolation inside word', () => {
      const root = parse('.@{class} {}');

      expect(root.first.selector).to.eql('.@{class}');
    });

    it('parses non-interpolation', () => {
      const root = parse('\\@{ color: black }');

      expect(root.first.selector).to.eql('\\@');
    });
  });
});
