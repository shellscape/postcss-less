const test = require('ava');

const { parse } = require('../../lib');

test('inline &:extend()', (t) => {
  const code = '.a:extend(.b) {color: red;}';
  const { first } = parse(code);

  t.is(first.selector, '.a:extend(.b)');
});

test('inline &:extend() with multiple parameters', (t) => {
  const code = '.e:extend(.f, .g) {}';
  const { first } = parse(code);

  t.is(first.selector, '.e:extend(.f, .g)');
});

test('inline &:extend() with nested selector in parameters', (t) => {
  const code = '.e:extend(.a .g, b span) {}';
  const { first } = parse(code);

  t.is(first.selector, '.e:extend(.a .g, b span)');
});

test('parses nested &:extend()', (t) => {
  const code = '.a {\n      &:extend(.bucket tr);\n}';
  const { first } = parse(code);

  t.is(first.selector, '.a');
  t.is(first.first.prop, '&');
  t.is(first.first.value, 'extend(.bucket tr)');
});

test('parses :extend() after selector', (t) => {
  const code = 'pre:hover:extend(div pre){}';
  const { first } = parse(code);

  t.is(first.selector, 'pre:hover:extend(div pre)');
});

test('parses :extend() after selector. 2', (t) => {
  const code = 'pre:hover :extend(div pre){}';
  const { first } = parse(code);

  t.is(first.selector, 'pre:hover :extend(div pre)');
});

test('parses multiple extends', (t) => {
  const code = 'pre:hover:extend(div pre):extend(.bucket tr) { }';
  const { first } = parse(code);

  t.is(first.selector, 'pre:hover:extend(div pre):extend(.bucket tr)');
});

test('parses nth expression in extend', (t) => {
  const code = ':nth-child(1n+3) {color: blue;} .child:extend(:nth-child(n+3)) {}';
  const root = parse(code);
  const { first, last } = root;

  t.is(first.selector, ':nth-child(1n+3)');
  t.is(last.selector, '.child:extend(:nth-child(n+3))');
});

test('"all"', (t) => {
  const code = '.replacement:extend(.test all) {}';
  const { first } = parse(code);

  t.is(first.selector, '.replacement:extend(.test all)');
});

test('with interpolation', (t) => {
  const code = '.bucket {color: blue;}\n.some-class:extend(@{variable}) {}\n@variable: .bucket;';
  const root = parse(code);

  t.is(root.nodes[0].selector, '.bucket');
  t.is(root.nodes[1].selector, '.some-class:extend(@{variable})');
});
