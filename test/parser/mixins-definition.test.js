const test = require('ava');

const { parse } = require('../../lib');

test('with empty params', async (t) => {
  const less = '.foo() { color: red; }';
  const { first } = parse(less);

  t.is(first.type, 'atrule');
  t.is(first.name, 'foo');
  t.is(first.params, '()');
});

test('with one param', async (t) => {
  const less = '.foo(@_color: red) { color: @_color; }';
  const { first } = parse(less);

  t.is(first.type, 'atrule');
  t.is(first.name, 'foo');
  t.is(first.params, '(@_color: red)');
});

test('with two params', async (t) => {
  const less = '.foo(@_color: red; @_width: 100px) { color: @_color; width: @_width; }';
  const { first } = parse(less);

  t.is(first.type, 'atrule');
  t.is(first.name, 'foo');
  t.is(first.params, '(@_color: red; @_width: 100px)');
});

test('with params and when condition', async (t) => {
  const less = '.foo(@_color: red; @_width: 100px) when (@mode = huge) { color: @_color; width: @_width; }';
  const { first } = parse(less);

  t.is(first.type, 'atrule');
  t.is(first.name, 'foo');
  t.is(first.params, '(@_color: red; @_width: 100px) when (@mode = huge)');
});

test('with params and 2x when condition', async (t) => {
  const less = '.foo(@_color: red; @_width: 100px) when (@mode = huge) and (@mode = small) { color: @_color; width: @_width; }';
  const { first } = parse(less);

  t.is(first.type, 'atrule');
  t.is(first.name, 'foo');
  t.is(first.params, '(@_color: red; @_width: 100px) when (@mode = huge) and (@mode = small)');
});

test('avoids parsing pseudos as mixins', async (t) => {
  const less = '.foo:is(input) { color: red; }';
  const { first } = parse(less);

  t.is(first.type, 'rule');
  t.is(first.selector, '.foo:is(input)');
});
