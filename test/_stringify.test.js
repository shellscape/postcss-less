const test = require('ava');
const postcss = require('postcss');

const postcssLess = require('../lib');
const parse = require('../lib/less-parse');
const stringify = require('../lib/less-stringify');

test('stringifies inline comment', (t) => {
  const root = parse('// comment\na {}');
  let result = '';

  stringify(root, (i) => {
    result += i;
  });

  t.is(result, '// comment\na {}');
});

test('stringifies inline comment in the end of file', (t) => {
  const root = parse('// comment');
  let result = '';

  stringify(root, (i) => {
    result += i;
  });

  t.is(result, '// comment');
});

test('stringifies mixin without body. #1',  async (t) => {
  const less = '.selector:extend(.f, .g)  {&:extend(.a);}';
  const result = await postcss().process(less, {
    syntax: postcssLess,
    stringifier: stringify
  });

  t.is(result.content, less);
});

test('stringifies mixins', (t) => {
  const root = parse('.foo (@bar; @baz...) { border: @{baz}; }');
  let result = '';

  stringify(root, (i) => {
    result += i;
  });

  t.is(result, '.foo (@bar; @baz...) { border: @{baz}; }');
});

test('stringifies mixin without body. #2',  async (t) => {
  const less = '.mix() {color: red} .selector {.mix()}';
  const result = await postcss().process(less, {
    syntax: postcssLess,
    stringifier: stringify
  });

  t.is(result.content, less);
});

test('stringifies mixin without body. #3',  async (t) => {
  const less = `
  .container {
      .mixin-1();
      .mixin-2;
      .mixin-3 (@width: 100px) {
          width: @width;
      }
  }

  .rotation(@deg:5deg){
    .transform(rotate(@deg));
  }
`;

  const result = await postcss().process(less, {
    syntax: postcssLess,
    stringifier: stringify
  });

  t.is(result.content, less);
});

test('stringifies mixin with !important',  async (t) => {
  const less = '.foo { .mix() ! important; }';

  const result = await postcss().process(less, {
    syntax: postcssLess,
    stringifier: stringify
  });

  t.is(result.content, less);
});
