const test = require('ava');
const postcss = require('postcss');
const AtRule = require('postcss/lib/at-rule');
const CssSyntaxError = require('postcss/lib/css-syntax-error');

const Import = require('../lib/import');
const lessSyntax = require('../lib');

test('should process LESS syntax',  async (t) => {
  const lessText = 'a { b {} }';
  const result = await postcss().process(lessText, { syntax: lessSyntax });

  t.truthy(result);
  t.is(result.css, lessText);
  t.is(result.content, lessText);
});

test('should parse LESS mixins as at rules',  async (t) => {
  const lessText = '.foo (@bar; @baz...) { border: @{baz}; }';
  const result = await postcss().process(lessText, { syntax: lessSyntax });

  t.truthy(result);
  t.is(result.css, lessText);
  t.is(result.content, lessText);
});

test('should not parse invalid LESS (#64)',  async (t) => {
  const lessText = '.foo';

  try {
    await postcss().process(lessText, { syntax: lessSyntax });
  }
  catch (e) {
    t.true(e instanceof CssSyntaxError);
  }
});

test('should parse @imports as Import',  async (t) => {
  const lessText = '@import (inline) "foo.less";';
  const result = await postcss().process(lessText, { syntax: lessSyntax });

  t.truthy(result);
  t.is(result.css, lessText);
  t.true(result.root.first instanceof Import);
  t.is(result.root.first.directives, '(inline)');
  t.is(result.root.first.importPath, '"foo.less"');
});

test('should parse @at-rules and @imports differently',  async (t) => {
  const lessText = '@const (inline) "foo.less";';
  const result = await postcss().process(lessText, { syntax: lessSyntax });

  t.truthy(result);
  t.is(result.css, lessText);
  t.true(result.root.first instanceof AtRule);
});

test('should create its own Root node stringifier (#82)',  async (t) => {
  const lessText = '@const "foo.less"';
  const result = await postcss().process(lessText, { syntax: lessSyntax });

  t.is(result.root.toString(), lessText);
});