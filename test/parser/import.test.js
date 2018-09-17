const test = require('ava');
const postcss = require('postcss');
const AtRule = require('postcss/lib/at-rule');

const Import = require('../../lib/import');
const lessSyntax = require('../../lib');

test('should parse @at-rules and @imports differently',  async (t) => {
  const lessText = '@const (inline) "foo.less";';
  const result = await postcss().process(lessText, { syntax: lessSyntax });

  t.truthy(result);
  t.is(result.css, lessText);
  t.true(result.root.first instanceof AtRule);
});

test('should parse @imports as Import', async (t) => {
  const lessText = '@import "foo.less";';
  const result = await postcss().process(lessText, { syntax: lessSyntax });

  t.truthy(result);
  t.is(result.css, lessText);
  t.true(result.root.first instanceof Import);
  t.is(result.root.first.filename, '"foo.less"');
});

test('should parse @imports with a url function as Import', async (t) => {
  const lessText = '@import url("foo.less");';

  const result = await postcss().process(lessText, { syntax: lessSyntax });

  t.truthy(result);
  t.is(result.css, lessText);
  t.true(result.root.first instanceof Import);
  t.is(result.root.first.filename, '"foo.less"');
  t.is(result.root.first.urlFunc, true);
});

test('should parse @imports with a quote-less url function as Import', async (t) => {
  const lessText = '@import url(foo.less);';
  const result = await postcss().process(lessText, { syntax: lessSyntax });

  t.truthy(result);
  t.is(result.css, lessText);
  t.true(result.root.first instanceof Import);
  t.is(result.root.first.filename, 'foo.less');
  t.is(result.root.first.urlFunc, true);
});

test('should parse @imports as Import, no space', async (t) => {
  const lessText = '@import"foo.less";';
  const result = await postcss().process(lessText, { syntax: lessSyntax });

  t.truthy(result);
  t.is(result.css, lessText);
  t.true(result.root.first instanceof Import);
  t.is(result.root.first.filename, '"foo.less"');
  t.falsy(result.root.first.raws.afterName);
});

test('should parse @imports with a directive', async (t) => {
  const lessText = '@import (inline) "foo.less";';
  const result = await postcss().process(lessText, { syntax: lessSyntax });

  t.truthy(result);
  t.is(result.css, lessText);
  t.true(result.root.first instanceof Import);
  t.is(result.root.first.directives, '(inline)');
  t.is(result.root.first.filename, '"foo.less"');
});

test('should parse @imports with multiple directives', async (t) => {
  const lessText = '@import (inline, optional) "foo.less";';
  const result = await postcss().process(lessText, { syntax: lessSyntax });

  t.truthy(result);
  t.is(result.css, lessText);
  t.true(result.root.first instanceof Import);
  t.is(result.root.first.directives, '(inline, optional)');
  t.is(result.root.first.filename, '"foo.less"');
});

test('should parse @imports with malformed filename (#88)', async (t) => {
  const lessText = '@import missing "missing" "not missing";';
  const result = await postcss().process(lessText, { syntax: lessSyntax });

  t.truthy(result);
  t.is(result.css, lessText);
  t.true(result.root.first instanceof Import);
  t.is(result.root.first.filename, 'missing "missing" "not missing"');
});

test('should parse @imports with mmissing semicolon (#88)', async (t) => {
  const lessText = `
@import "../assets/font/league-gothic/league-gothic.css"

.ManagerPage {
  height: 100%;
}`;
  const result = await postcss().process(lessText, { syntax: lessSyntax });

  t.truthy(result);
  t.true(result.root.first instanceof Import);
  t.is(result.root.first.filename, '"../assets/font/league-gothic/league-gothic.css"\n\n.ManagerPage');
});
