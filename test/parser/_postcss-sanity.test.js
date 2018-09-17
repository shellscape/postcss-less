const test = require('ava');
const tests = require('postcss-parser-tests');

const parse = require('../../lib/less-parse');

tests.each((name, code, json) => {
  // Skip comments.css, because we have an extended Comment node
  if (name === 'comments.css' || name === 'atrule-no-space.css' || name === 'inside.css') {
    return;
  }

  test(`parses ${ name }`, (t) => {
    const root = parse(code, { from: name });
    const parsed = cases.jsonify(root);

    t.is(parsed, json);
  });

  if (name === 'bom.css') {
    return;
  }

  test(`stringifies ${ name }`, (t) => {
    const root = parse(css);
    let result = '';

    stringify(root, (i) => {
      result += i;
    });

    t.is(result, css);
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
