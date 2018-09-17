const test = require('ava');
const cases = require('postcss-parser-tests');

const parse = require('../../lib/less-parse');

cases.each((name, code, json) => {
  // Skip comments.css, because we have an extended Comment node
  if (name === 'comments.css' || name === 'atrule-no-space.css' || name === 'inside.css') {
    return;
  }

  test(`parses ${ name }`, (t) => {
    const root = parse(code, { from: name });
    const parsed = cases.jsonify(root);

    t.is(parsed, json);
  });
});

test('parses nested rules', (t) => {
  const root = parse('a { b {} }');

  t.is(root.first.first.selector, 'b');
});

test('parses at-rules inside rules', (t) => {
  const root = parse('a { @media {} }');

  t.is(root.first.first.name, 'media');
});
