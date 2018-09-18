const test = require('ava');
const AtRule = require('postcss/lib/at-rule');

const { parse } = require('../../lib');

test('numeric', (t) => {
  const root = parse('@var: 1;');
  const { first } = root;

  t.true(first instanceof AtRule);
  t.is(first.name, 'var');
  t.is(first.value, '1');
});

test('whitespaces between name and ":"', (t) => {
  const root = parse('@onespace : 42;');
  const { first } = root;

  t.is(first.name, 'onespace');
  t.is(first.value, '42');
});

test('no whitespace between ":" and value', (t) => {
  const root = parse('@var :42;');
  const { first } = root;

  t.is(first.name, 'var');
  t.is(first.value, '42');
});

test('mutliple variables with whitespaces between name and ":"', (t) => {
  const root = parse('@batman  : 42; @superman : 24;');
  const { first, last } = root;

  t.is(first.name, 'batman');
  t.is(first.value, '42');
  t.is(last.name, 'superman');
  t.is(last.value, '24');
});

test('multiple variables with no whitespace between ":" and value', (t) => {
  const root = parse('@batman  :42; @superman :24');
  const { first, last } = root;

  t.is(first.name, 'batman');
  t.is(first.value, '42');
  t.is(last.name, 'superman');
  t.is(last.value, '24');
});

test('@pagexxx like variable but not @page selector', (t) => {
  let root = parse('@pageWidth: "test";');

  let { first } = root;

  t.is(first.name, 'pageWidth');
  t.is(first.value, '"test"');

  root = parse('@page-width: "test";');
  ({ first } = root);

  t.is(first.name, 'page-width');
  t.is(first.value, '"test"');
});

test('@pagexxx like variable with whitespaces between name and ":"', (t) => {
  let root = parse('@pageWidth :"test";');

  let { first } = root;

  t.is(first.name, 'pageWidth');
  t.is(first.value, '"test"');

  root = parse('@page-width :"test";');
  ({ first } = root);

  t.is(first.name, 'page-width');
  t.is(first.value, '"test"');

  root = parse('@page-width : "test";');
  ({ first } = root);

  t.is(first.name, 'page-width');
  t.is(first.value, '"test"');
});

test('string values', (t) => {
  const root = parse('@var: "test";');
  const { first } = root;

  t.is(first.name, 'var');
  t.is(first.value, '"test"');
});

test('mixed variables', (t) => {
  const propValue = '(   \n( ((@line-height))) * (@lines-to-show) )em';
  const root = parse(`h1 { max-height: ${propValue}; }`);
  const { first } = root;

  t.is(first.selector, 'h1');
  t.is(first.first.prop, 'max-height');
  t.is(first.first.value, propValue);
});

test('color (hash) variables', (t) => {
  const root = parse('@var: #fff;');
  const { first } = root;

  t.is(first.name, 'var');
  t.is(first.value, '#fff');
});
