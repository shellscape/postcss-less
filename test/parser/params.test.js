const test = require('ava');

const parse = require('../../lib/less-parse');

test('should not assign parameters for pseudo-selectors (#56)', (t) => {
  const code = '.test2:not(.test3) {}';
  const root = parse(code);

  t.is(root.first.selector, '.test2:not(.test3)');
  t.falsy(root.first.params);
});

// sanity check = require(issue #99
test('should not assign parameters for bracket selectors', (t) => {
  const code = '@media only screen and ( max-width: ( @narrow - 1px ) ) {\n  padding: 10px 24px 20px;\n}';
  const root = parse(code);

  t.is(root.first.type, 'atrule');
});

test('should not assign parameters for bracket selectors (2)', (t) => {
  const code = '.test1,.test2[test=test] {}';
  const root = parse(code);

  t.is(root.first.selector, '.test1,.test2[test=test]');
  t.falsy(root.first.params);
});
