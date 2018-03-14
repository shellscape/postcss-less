// chai uses expressions for validation
/* eslint no-unused-expressions: 0 */

import { expect } from 'chai';
import parse from '../../lib/less-parse';

describe('Parser', () => {
  describe('Variables', () => {
    it('parses numeric variables', () => {
      const root = parse('@var: 1;');

      expect(root.first.prop).to.eql('@var');
      expect(root.first.value).to.eql('1');
    });

    it('parses variables with whitespaces between name and ":"', () => {
      const root = parse('@foo  : 42; @bar : 35;');

      expect(root.first.prop).to.eql('@foo');
      expect(root.first.value).to.eql('42');
      expect(root.nodes[1].prop).to.eql('@bar');
      expect(root.nodes[1].value).to.eql('35');
    });

    it('parses variables with no whitespace between ":" and value', () => {
      const root = parse('@foo  :42; @bar :35');

      expect(root.first.prop).to.eql('@foo');
      expect(root.first.value).to.eql('42');
      expect(root.nodes[1].prop).to.eql('@bar');
      expect(root.nodes[1].value).to.eql('35');
    });

    it('parses string variables', () => {
      const root = parse('@var: "test";');

      expect(root.first.prop).to.eql('@var');
      expect(root.first.value).to.eql('"test"');
    });

    it('parses mixed variables', () => {
      const propValue = '(   \n( ((@line-height))) * (@lines-to-show) )em';
      const root = parse(`h1 { max-height: ${ propValue }; }`);

      expect(root.first.selector).to.eql('h1');
      expect(root.first.first.prop).to.eql('max-height');
      expect(root.first.first.value).to.eql(propValue);
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
});
