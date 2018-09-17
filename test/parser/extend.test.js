const test = require('ava');

const parse = require('../../lib/less-parse');

test('parses inline &:extend()', (t) => {
  const code = '.a:extend(.b) {color: red;}';
  const root = parse(code);

  t.is(root.first.selector, '.a:extend(.b)');
});

test('parses inline &:extend() with multiple parameters', (t) => {
  const code = '.e:extend(.f, .g) {}';
  const root = parse(code);

  t.is(root.first.selector, '.e:extend(.f, .g)');
});

test('parses inline &:extend() with nested selector in parameters', (t) => {
  const code = '.e:extend(.a .g, b span) {}';
  const root = parse(code);

  t.is(root.first.selector, '.e:extend(.a .g, b span)');
});

test('parses nested &:extend()', (t) => {
  const code = '.a {\n      &:extend(.bucket tr);\n}';
  const root = parse(code);

  t.is(root.first.selector, '.a');
  t.is(root.first.first.selector, '&:extend(.bucket tr)');
  t.is(root.first.first.params, '(.bucket tr)');
  t.is(root.first.first.extend, true);
  t.is(root.first.first.toString(), '&:extend(.bucket tr);');
});

test('parses :extend() after selector', (t) => {
  const code = 'pre:hover:extend(div pre){}';
  const root = parse(code);

  t.is(root.first.selector, 'pre:hover:extend(div pre)');
});

test('parses :extend() after selector. 2', (t) => {
  const code = 'pre:hover :extend(div pre){}';
  const root = parse(code);

  t.is(root.first.selector, 'pre:hover :extend(div pre)');
});

test('parses multiple extends', (t) => {
  const code = 'pre:hover:extend(div pre):extend(.bucket tr) { }';
  const root = parse(code);

  t.is(root.first.selector, 'pre:hover:extend(div pre):extend(.bucket tr)');
});

test('parses nth expression in extend', (t) => {
  const code = ':nth-child(1n+3) {color: blue;} .child:extend(:nth-child(n+3)) {}';
  const root = parse(code);

  t.is(root.first.selector, ':nth-child(1n+3)');
  t.is(root.nodes[1].selector, '.child:extend(:nth-child(n+3))');
});

test('parses extend "all"', (t) => {
  const code = '.replacement:extend(.test all) {}';
  const root = parse(code);

  t.is(root.first.selector, '.replacement:extend(.test all)');
});

test('parses extend with interpolation', (t) => {
  const code = '.bucket {color: blue;}\n.some-class:extend(@{variable}) {}\n@variable: .bucket;';
  const root = parse(code);

  t.is(root.nodes[0].selector, '.bucket');
  t.is(root.nodes[1].selector, '.some-class:extend(@{variable})');
});
