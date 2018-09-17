// chai uses expressions for validation
/* eslint no-unused-expressions: 0 */

import { expect } from 'chai';
import parse from '../../lib/less-parse';

describe('Parser', () => {
  describe('Extend', () => {
    it('parses inline &:extend()', () => {
      const code = '.a:extend(.b) {color: red;}';
      const root = parse(code);

      expect(root.first.selector, '.a:extend(.b)');
    });

    it('parses inline &:extend() with multiple parameters', () => {
      const code = '.e:extend(.f, .g) {}';
      const root = parse(code);

      expect(root.first.selector, '.e:extend(.f, .g)');
    });

    it('parses inline &:extend() with nested selector in parameters', () => {
      const code = '.e:extend(.a .g, b span) {}';
      const root = parse(code);

      expect(root.first.selector, '.e:extend(.a .g, b span)');
    });

    it('parses nested &:extend()', () => {
      const code = '.a {\n      &:extend(.bucket tr);\n}';
      const root = parse(code);

      expect(root.first.selector, '.a');
      expect(root.first.first.selector, '&:extend(.bucket tr)');
      expect(root.first.first.params, '(.bucket tr)');
      expect(root.first.first.extend, true);
      expect(root.first.first.toString()).to.be.eql('&:extend(.bucket tr);');
    });

    it('parses :extend() after selector', () => {
      const code = 'pre:hover:extend(div pre){}';
      const root = parse(code);

      expect(root.first.selector, 'pre:hover:extend(div pre)');
    });

    it('parses :extend() after selector. 2', () => {
      const code = 'pre:hover :extend(div pre){}';
      const root = parse(code);

      expect(root.first.selector, 'pre:hover :extend(div pre)');
    });

    it('parses multiple extends', () => {
      const code = 'pre:hover:extend(div pre):extend(.bucket tr) { }';
      const root = parse(code);

      expect(root.first.selector, 'pre:hover:extend(div pre):extend(.bucket tr)');
    });

    it('parses nth expression in extend', () => {
      const code = ':nth-child(1n+3) {color: blue;} .child:extend(:nth-child(n+3)) {}';
      const root = parse(code);

      expect(root.first.selector, ':nth-child(1n+3)');
      expect(root.nodes[1].selector, '.child:extend(:nth-child(n+3))');
    });

    it('parses extend "all"', () => {
      const code = '.replacement:extend(.test all) {}';
      const root = parse(code);

      expect(root.first.selector, '.replacement:extend(.test all)');
    });

    it('parses extend with interpolation', () => {
      const code = '.bucket {color: blue;}\n.some-class:extend(@{variable}) {}\n@variable: .bucket;';
      const root = parse(code);

      expect(root.nodes[0].selector, '.bucket');
      expect(root.nodes[1].selector, '.some-class:extend(@{variable})');
    });
  });
});
