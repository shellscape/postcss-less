// chai uses expressions for validation
/* eslint no-unused-expressions: 0 */

import { expect } from 'chai';
import parse from '../../lib/less-parse';

describe('Parser', () => {
  describe('Interpolation', () => {
    it('parses interpolation', () => {
      const root = parse('@{selector}:hover { @{prop}-size: @{color} }');

      expect(root.first.selector, '@{selector}:hover');
      expect(root.first.first.prop, '@{prop}-size');
      expect(root.first.first.value, '@{color}');
    });

    it('parses mixin interpolation', () => {
      const less = '.browser-prefix(@prop, @args) {\n @{prop}: @args;\n}';
      const root = parse(less);

      expect(root.first.selector, '.browser-prefix(@prop, @args)');
      expect(root.first.first.prop, '@{prop}');
      expect(root.first.first.value, '@args');
    });

    it('parses interpolation inside word', () => {
      const root = parse('.@{class} {}');

      expect(root.first.selector, '.@{class}');
    });

    it('parses non-interpolation', () => {
      const root = parse('\\@{ color: black }');

      expect(root.first.selector, '\\@');
    });
  });
});
