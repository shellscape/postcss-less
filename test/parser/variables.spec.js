// chai uses expressions for validation
/* eslint no-unused-expressions: 0 */

import * as fs from 'fs';
import * as path from 'path';
import { expect } from 'chai';
import parse from '../../lib/less-parse';

describe('Parser', () => {
  describe('Variables', () => {
    it('parses numeric variables', () => {
      const root = parse('@var: 1;');

      expect(root.first.prop, '@var');
      expect(root.first.value, '1');
    });

    // sanity check from issue #99
    it('should not fail wikimedia sanity check', () => {
      const code = fs.readFileSync(path.join(__dirname, '../../../test/integration/ext.cx.dashboard.less'), 'utf-8');
      const root = parse(code);

      expect(root.first.type, 'import');
    });

    // #98 was merged to resolve this but broke other scenarios
    it('parses variables with whitespaces between name and ":"', () => {
      let root = parse('@onespace : 42;');

      expect(root.first.prop, '@onespace');
      expect(root.first.value, '42');
    });

    // #98 was merged to resolve this but broke other scenarios
    // these tests are commented out until that is resolved
    it('parses variables with no whitespace between ":" and value', () => {
      const root = parse('@var :42;');

      expect(root.first.prop, '@var');
      expect(root.first.value, '42');
    });

    it('parses mutliple variables with whitespaces between name and ":"', () => {
      const root = parse('@foo  : 42; @bar : 35;');

      expect(root.first.prop, '@foo');
      expect(root.first.value, '42');
      expect(root.nodes[1].prop, '@bar');
      expect(root.nodes[1].value, '35');
    });

    it('parses multiple variables with no whitespace between ":" and value', () => {
      const root = parse('@foo  :42; @bar :35');

      expect(root.first.prop, '@foo');
      expect(root.first.value, '42');
      expect(root.nodes[1].prop, '@bar');
      expect(root.nodes[1].value, '35');
    });

    it('parses @pagexxx like variable but not @page selector', () => {
      const root = parse('@pageWidth: "test";');

      expect(root.first.prop, '@pageWidth');
      expect(root.first.value, '"test"');

      const root2 = parse('@page-width: "test";');

      expect(root2.first.prop, '@page-width');
      expect(root2.first.value, '"test"');
    });

    it('parses @pagexxx like variable with whitespaces between name and ":"', () => {
      const root = parse('@pageWidth :"test";');

      expect(root.first.prop, '@pageWidth');
      expect(root.first.value, '"test"');

      const root2 = parse('@page-width :"test";');

      expect(root2.first.prop, '@page-width');
      expect(root2.first.value, '"test"');

      const root3 = parse('@page-width : "test";');

      expect(root3.first.prop, '@page-width');
      expect(root3.first.value, '"test"');
    });


    it('parses string variables', () => {
      const root = parse('@var: "test";');

      expect(root.first.prop, '@var');
      expect(root.first.value, '"test"');
    });

    it('parses mixed variables', () => {
      const propValue = '(   \n( ((@line-height))) * (@lines-to-show) )em';
      const root = parse(`h1 { max-height: ${ propValue }; }`);

      expect(root.first.selector, 'h1');
      expect(root.first.first.prop, 'max-height');
      expect(root.first.first.value, propValue);
    });

    it('parses color (hash) variables', () => {
      const root = parse('@var: #fff;');

      expect(root.first.prop, '@var');
      expect(root.first.value, '#fff');
    });

    it('parses interpolation', () => {
      const root = parse('@{selector}:hover { @{prop}-size: @{color} }');

      expect(root.first.selector, '@{selector}:hover');
      expect(root.first.first.prop, '@{prop}-size');
      expect(root.first.first.value, '@{color}');
    });

    it('parses interpolation inside word', () => {
      const root = parse('.@{class} {}');

      expect(root.first.selector, '.@{class}');
    });

    it('parses interpolation inside word', () => {
      const root = parse('.@{class} {}');

      expect(root.first.selector, '.@{class}');
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

      expect(root.first.selector, '.m_transition (...)');
      expect(root.first.first.prop, '@props');
      expect(root.first.first.value, '~`"@{arguments}".replace(/[\[\]]/g, \'\')`');
      expect(root.nodes[1].first.selector, '& ~ .stock-bar__content .stock-bar__control_pause');
    });
  });
});
