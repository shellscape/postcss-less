const test = require('ava');

const parse = require('../../lib/less-parse');

test('parses interpolation', (t) => {
  const root = parse('@{selector}:hover { @{prop}-size: @{color} }');

  t.is(root.first.selector, '@{selector}:hover');
  t.is(root.first.first.prop, '@{prop}-size');
  t.is(root.first.first.value, '@{color}');
});

test('parses mixin interpolation', (t) => {
  const less = '.browser-prefix(@prop, @args) {\n @{prop}: @args;\n}';
  const root = parse(less);

  t.is(root.first.selector, '.browser-prefix(@prop, @args)');
  t.is(root.first.first.prop, '@{prop}');
  t.is(root.first.first.value, '@args');
});

test('parses interpolation inside word', (t) => {
  const root = parse('.@{class} {}');

  t.is(root.first.selector, '.@{class}');
});

test('parses non-interpolation', (t) => {
  const root = parse('\\@{ color: black }');

  t.is(root.first.selector, '\\@');
});
