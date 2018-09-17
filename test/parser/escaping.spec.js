// chai uses expressions for validation
/* eslint no-unused-expressions: 0 */

import { expect } from 'chai';
import parse from '../../lib/less-parse';

describe('Parser', () => {
  describe('Escaping', () => {
    it('parses escaped string', () => {
      const code = `
                @testVar: 10px;

                .test-wrap {
                    .selector {
                        height: calc(~"100vh - @{testVar}");
                    }
                }
            `;
      const root = parse(code);

      expect(root.first.prop, '@testVar');
      expect(root.first.value, '10px');
      expect(root.last.first.first.prop, 'height');
      expect(root.last.first.first.value, 'calc(~"100vh - @{testVar}")');
    });

    it('parses escaping inside nested rules', () => {
      const code = `
                .test1 {
                    .another-test {
                        prop1: function(~"@{variable}");
                    }
                }

                .test2 {
                    prop2: function(~\`@{test}\`);
                }

                .test3 {
                    filter: ~"alpha(opacity='@{opacity}')";
                }
            `;
      const root = parse(code);

      expect(root.nodes[0].first.first.prop, 'prop1');
      expect(root.nodes[0].first.first.value, 'function(~"@{variable}")');
      expect(root.nodes[1].first.prop, 'prop2');
      expect(root.nodes[1].first.value, 'function(~`@{test}`)');
      expect(root.nodes[2].first.prop, 'filter');
      expect(root.nodes[2].first.value, '~"alpha(opacity=\'@{opacity}\')"');
    });
  });
});
