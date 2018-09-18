const test = require('ava');
const AtRule = require('postcss/lib/at-rule');

const { parse } = require('../../lib');

test('@at-rules != @imports', async (t) => {
  const less = '@const "foo.less";';
  const result = parse(less);
  const {
    first,
    source: { input }
  } = result;

  t.truthy(result);
  t.is(input.css, less);
  t.true(first instanceof AtRule);
  t.falsy(first.import);
});

test('@imports', async (t) => {
  const less = '@import "foo.less";';
  const result = parse(less);
  const {
    first,
    source: { input }
  } = result;

  t.truthy(result);
  t.is(input.css, less);
  t.true(first.import);
  t.is(first.filename, '"foo.less"');
});

test('import options', async (t) => {
  const less = '@import (inline) "foo.less";';
  const { first } = parse(less);

  t.is(first.options, '(inline)');
});

test('multiple import options', async (t) => {
  const less = '@import (inline, once, optional) "foo.less";';
  const { first } = parse(less);

  t.is(first.options, '(inline, once, optional)');
});

test('url("filename")', async (t) => {
  const less = '@import url("foo.less");';
  const { first } = parse(less);

  t.is(first.filename, '"foo.less"');
});

test('url(filename)', async (t) => {
  const less = '@import url(foo.less);';
  const { first } = parse(less);

  t.is(first.filename, 'foo.less');
});

test('no spaces', async (t) => {
  const less = '@import"foo.less";';
  const { first } = parse(less);

  t.is(first.filename, '"foo.less"');
});

test('malformed filename (#88)', async (t) => {
  const less = '@import missing "missing" "not missing";';
  const { first } = parse(less);

  t.is(first.filename, 'missing "missing" "not missing"');
});

test('mmissing semicolon (#88)', async (t) => {
  const less = `
@import "../assets/font/league-gothic/league-gothic.css"

.ManagerPage {
  height: 100%;
}`;
  const { first } = parse(less);

  t.is(first.filename, '"../assets/font/league-gothic/league-gothic.css"\n\n.ManagerPage');
});
