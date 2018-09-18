const test = require('ava');
const tests = require('postcss-parser-tests');

const { parse } = require('../../lib');

tests.each((name, code, json) => {
  // Skip comments.css, because we have an extended Comment node
  if (name === 'comments.css' || name === 'atrule-no-space.css' || name === 'inside.css') {
    return;
  }

  test(`parses ${name}`, (t) => {
    const root = parse(code, { from: name });
    const parsed = tests.jsonify(root);

    t.is(parsed, json);
  });

  if (name === 'bom.css') {
    return; // eslint-disable-line no-useless-return
  }

  // TODO: enable once stringifying is put in place
  // test(`stringifies ${name}`, (t) => {
  //   const root = parse(code);
  //   let result = '';
  //
  //   stringify(root, (i) => {
  //     result += i;
  //   });
  //
  //   t.is(result, code);
  // });
});

test('parses nested rules', (t) => {
  const root = parse('a { b {} }');

  t.is(root.first.first.selector, 'b');
});

test('parses at-rules inside rules', (t) => {
  const root = parse('a { @media {} }');

  t.is(root.first.first.name, 'media');
});
