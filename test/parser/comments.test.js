const test = require('ava');
const Comment = require('postcss/lib/comment');

const { parse } = require('../../lib');

test('inline comment', (t) => {
  const root = parse('// batman');
  const { first } = root;

  t.truthy(root);
  t.true(first instanceof Comment);
  t.true(first.inline);
  t.is(first.text, 'batman');
});

test('close empty', (t) => {
  const root = parse('// \n//');
  const { first, last } = root;

  t.truthy(root.nodes.length);
  t.is(first.text, '');
  t.is(last.text, '');
});

test('close inline and block', (t) => {
  const root = parse('// batman\n/* cleans the batcave */');
  const { first, last } = root;

  t.truthy(root.nodes.length);
  t.is(first.text, 'batman');
  t.is(last.text, 'cleans the batcave');
});

test('parses multiline comments', (t) => {
  const text = 'batman\n   robin\n   joker';
  const comment = ` /* ${text} */ `;
  const root = parse(comment);
  const { first } = root;

  t.is(root.nodes.length, 1);
  t.is(first.text, text);
  t.deepEqual(first.raws, {
    before: ' ',
    left: ' ',
    right: ' '
  });
  t.falsy(first.inline);
});

test('ignores pseudo-comments constructions', (t) => {
  const { first } = parse('a { cursor: url(http://site.com) }');

  t.false(first instanceof Comment);
});
