// chai uses expressions for validation
/* eslint no-unused-expressions: 0 */

import { expect } from 'chai';
import parse from '../../lib/less-parse';

describe('Parser', () => {
  describe('Comments', () => {
    it('parses inline comments', () => {
      const root = parse('\n// here is the first comment \n/* here is the second comment */');

      expect(root.nodes.length).to.eql(2);
      expect(root.first.text, 'here is the first comment');
      expect(root.first.raws).to.eql({
        before: '\n',
        content: '// here is the first comment ',
        begin: '//',
        left: ' ',
        right: ' '
      });
      expect(root.first.inline, true);
      expect(root.first.block, false);
      expect(root.first.toString(), '/* here is the first comment */');

      expect(root.last.text).to.eql('here is the second comment');
      expect(root.last.raws).to.eql({
        before: '\n',
        content: '/* here is the second comment */',
        begin: '/*',
        left: ' ',
        right: ' '
      });
      expect(root.last.inline, false);
      expect(root.last.block, true);
      expect(root.last.toString(), '/* here is the second comment */');
    });

    it('parses empty inline comments', () => {
      const root = parse(' //\n// ');

      expect(root.first.text).to.eql('');
      expect(root.first.raws).to.eql({
        before: ' ',
        begin: '//',
        content: '//',
        left: '',
        right: ''
      });
      expect(root.last.inline, true);
      expect(root.last.block, false);

      expect(root.last.text).to.eql('');
      expect(root.last.raws).to.eql({
        before: '\n',
        begin: '//',
        content: '// ',
        left: ' ',
        right: ''
      });
      expect(root.last.inline, true);
      expect(root.last.block, false);
    });

    it('parses multiline comments', () => {
      const text = 'Hello!\n I\'m a multiline \n comment!';
      const comment = ` /*   ${ text }*/ `;
      const root = parse(comment);

      expect(root.nodes.length).to.eql(1);
      expect(root.first.text).to.eql(text);
      expect(root.first.raws).to.eql({
        before: ' ',
        begin: '/*',
        content: comment.trim(),
        left: '   ',
        right: ' '
      });
      expect(root.first.inline, false);
      expect(root.first.block, true);
      expect(root.first.toString(), `/*   ${ text } */`);
    });

    it('does not parse pseudo-comments constructions inside parentheses', () => {
      const root = parse('a { cursor: url(http://site.com) }');

      expect(root.first.first.value).to.eql('url(http://site.com)');
    });
  });
});
