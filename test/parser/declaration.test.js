const test = require('ava');

const parse = require('../../lib/less-parse');

test('should allow case-insensitive !important (#89)', (t) => {
  const code = 'a{k: v !IMPORTANT;}';
  const root = parse(code);
  const node = root.first.first;

  t.is(node.value, 'v');
  t.true(node.important);
});
