// chai uses expressions for validation
/* eslint no-unused-expressions: 0 */

import { expect } from 'chai';
import parse from '../../lib/less-parse';

describe('Parser', () => {
  describe('Params', () => {

    it('should not assign parameters for pseudo-selectors (#56)', () => {
      const code = '.test2:not(.test3) {}';
      const root = parse(code);

      expect(root.first.selector).to.eql('.test2:not(.test3)');
      expect(root.first.params).to.be.undefined;
    });

    // sanity check from issue #99
    it('should not assign parameters for bracket selectors', () => {
      const code = '@media only screen and ( max-width: ( @narrow - 1px ) ) {\n  padding: 10px 24px 20px;\n}';
      const root = parse(code);

      expect(root.first.type).to.eql('atrule');
    });

    it('should not assign parameters for bracket selectors', () => {
      const code = '.test1,.test2[test=test] {}';
      const root = parse(code);

      expect(root.first.selector).to.eql('.test1,.test2[test=test]');
      expect(root.first.params).to.be.undefined;
    });
  });
});
