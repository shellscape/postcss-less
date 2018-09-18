const test = require('ava');
const AtRule = require('postcss/lib/at-rule');

const { parse, nodeToString } = require('../../lib');

test('numeric', (t) => {
  const less = '@var: 1;';
  const root = parse(less);
  const { first } = root;

  t.true(first instanceof AtRule);
  t.is(first.name, 'var');
  t.is(first.value, '1');
  t.is(nodeToString(root), less);
});

test('whitespaces between name and ":"', (t) => {
  const less = '@onespace : 42;';
  const root = parse(less);
  const { first } = root;

  t.is(first.name, 'onespace');
  t.is(first.value, '42');
  t.is(nodeToString(root), less);
});

test('no whitespace between ":" and value', (t) => {
  const less = '@var :42;';
  const root = parse(less);
  const { first } = root;

  t.is(first.name, 'var');
  t.is(first.value, '42');
  t.is(nodeToString(root), less);
});

test('mutliple variables with whitespaces between name and ":"', (t) => {
  const less = '@batman  : 42; @superman : 24;';
  const root = parse(less);
  const { first, last } = root;

  t.is(first.name, 'batman');
  t.is(first.value, '42');
  t.is(last.name, 'superman');
  t.is(last.value, '24');
  t.is(nodeToString(root), less);
});

test('multiple variables with no whitespace between ":" and value', (t) => {
  const less = '@batman  :42; @superman :24';
  const root = parse(less);
  const { first, last } = root;

  t.is(first.name, 'batman');
  t.is(first.value, '42');
  t.is(last.name, 'superman');
  t.is(last.value, '24');
  t.is(nodeToString(root), less);
});

test('@pagexxx like variable but not @page selector', (t) => {
  let less = '@pageWidth: "test";';
  let root = parse(less);
  let { first } = root;

  t.is(first.name, 'pageWidth');
  t.is(first.value, '"test"');
  t.is(nodeToString(root), less);

  less = '@page-width: "test";';
  root = parse(less);
  ({ first } = root);

  t.is(first.name, 'page-width');
  t.is(first.value, '"test"');
  t.is(nodeToString(root), less);
});

test('@pagexxx like variable with whitespaces between name and ":"', (t) => {
  let less = '@pageWidth :"test";';
  let root = parse(less);
  let { first } = root;

  t.is(first.name, 'pageWidth');
  t.is(first.value, '"test"');
  t.is(nodeToString(root), less);

  less = '@page-width :"test";';
  root = parse(less);
  ({ first } = root);

  t.is(first.name, 'page-width');
  t.is(first.value, '"test"');
  t.is(nodeToString(root), less);

  less = '@page-width : "test";';
  root = parse(less);
  ({ first } = root);

  t.is(first.name, 'page-width');
  t.is(first.value, '"test"');
  t.is(nodeToString(root), less);
});

test('string values', (t) => {
  const less = '@var: "test";';
  const root = parse(less);
  const { first } = root;

  t.is(first.name, 'var');
  t.is(first.value, '"test"');
  t.is(nodeToString(root), less);
});

test('mixed variables', (t) => {
  const propValue = '(   \n( ((@line-height))) * (@lines-to-show) )em';
  const less = `h1 { max-height: ${propValue}; }`;
  const root = parse(less);
  const { first } = root;

  t.is(first.selector, 'h1');
  t.is(first.first.prop, 'max-height');
  t.is(first.first.value, propValue);
  t.is(nodeToString(root), less);
});

test('color (hash) variables', (t) => {
  const less = '@var: #fff;';
  const root = parse(less);
  const { first } = root;

  t.is(first.name, 'var');
  t.is(first.value, '#fff');
  t.is(nodeToString(root), less);
});
