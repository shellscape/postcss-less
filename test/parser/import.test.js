const test = require('ava');

const Import = require('../../lib/import');
const lessSyntax = require('../../lib');
const postcss = require('postcss');

test('should parse @imports as Import', async (t) => {
  const lessText = '@import "foo.less";';
  const result = await postcss().process(lessText, { syntax: lessSyntax });

  t.truthy(result);
  t.is(result.css, lessText);
  t.true(result.root.first instanceof Import);
  t.is(result.root.first.importPath, '"foo.less"');
});

test('should parse @imports with a url function as Import', async (t) => {
  const lessText = '@import url("foo.less");';

  const result = await postcss().process(lessText, { syntax: lessSyntax });

  t.truthy(result);
  t.is(result.css, lessText);
  t.true(result.root.first instanceof Import);
  t.is(result.root.first.importPath, '"foo.less"');
  t.is(result.root.first.urlFunc, true);
});

test('should parse @imports with a quote-less url function as Import', async (t) => {
  const lessText = '@import url(foo.less);';
  const result = await postcss().process(lessText, { syntax: lessSyntax });

  t.truthy(result);
  t.is(result.css, lessText);
  t.true(result.root.first instanceof Import);
  t.is(result.root.first.importPath, 'foo.less');
  t.is(result.root.first.urlFunc, true);
});

test('should parse @imports as Import, no space', async (t) => {
  const lessText = '@import"foo.less";';
  const result = await postcss().process(lessText, { syntax: lessSyntax });

  t.truthy(result);
  t.is(result.css, lessText);
  t.true(result.root.first instanceof Import);
  t.is(result.root.first.importPath, '"foo.less"');
  t.falsy(result.root.first.raws.afterName);
});

test('should parse @imports with directives', async (t) => {
  const lessText = '@import (inline) "foo.less";';
  const result = await postcss().process(lessText, { syntax: lessSyntax });

  t.truthy(result);
  t.is(result.css, lessText);
  t.true(result.root.first instanceof Import);
  t.is(result.root.first.directives, '(inline)');
  t.is(result.root.first.importPath, '"foo.less"');
});
