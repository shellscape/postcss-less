const test = require('ava');

const parse = require('../../lib/less-parse');

test('parses inline comments', (t) => {
  const root = parse('\n// here is the first comment \n/* here is the second comment */');

  t.is(root.nodes.length, 2);
  t.is(root.first.text, 'here is the first comment');
  t.deepEqual(root.first.raws, {
    before: '\n',
    content: '// here is the first comment ',
    begin: '//',
    left: ' ',
    right: ' '
  });
  t.is(root.first.inline, true);
  t.is(root.first.block, false);
  t.is(root.first.toString(), '/* here is the first comment */');

  t.is(root.last.text, 'here is the second comment');
  t.deepEqual(root.last.raws, {
    before: '\n',
    content: '/* here is the second comment */',
    begin: '/*',
    left: ' ',
    right: ' '
  });
  t.is(root.last.inline, false);
  t.is(root.last.block, true);
  t.is(root.last.toString(), '/* here is the second comment */');
});

test('parses empty inline comments', (t) => {
  const root = parse(' //\n// ');

  t.is(root.first.text, '');
  t.deepEqual(root.first.raws, {
    before: ' ',
    begin: '//',
    content: '//',
    left: '',
    right: ''
  });
  t.is(root.last.inline, true);
  t.is(root.last.block, false);

  t.is(root.last.text, '');
  t.deepEqual(root.last.raws, {
    before: '\n',
    begin: '//',
    content: '// ',
    left: ' ',
    right: ''
  });
  t.is(root.last.inline, true);
  t.is(root.last.block, false);
});

test('parses multiline comments', (t) => {
  const text = 'Hello!\n I\'m a multiline \n comment!';
  const comment = ` /*   ${ text }*/ `;
  const root = parse(comment);

  t.is(root.nodes.length, 1);
  t.is(root.first.text, text);
  t.deepEqual(root.first.raws, {
    before: ' ',
    begin: '/*',
    content: comment.trim(),
    left: '   ',
    right: ' '
  });
  t.is(root.first.inline, false);
  t.is(root.first.block, true);
  t.is(root.first.toString(), `/*   ${ text } */`);
});

test('does not parse pseudo-comments constructions inside parentheses', (t) => {
  const root = parse('a { cursor: url(http://site.com) }');

  t.is(root.first.first.value, 'url(http://site.com)');
});
