const test = require('ava');
const postcss = require('postcss');
const CssSyntaxError = require('postcss/lib/css-syntax-error');

const syntax = require('../lib');

const { parser } = syntax;

// silence the ridiculously verbose "You did not set any plugins, parser, or
// stringifier" warnings in PostCSS.
console.warn = () => {}; // eslint-disable-line no-console

test('should process LESS syntax', async (t) => {
  const less = 'a { b {} }';
  const result = await postcss().process(less, { syntax, parser });

  t.truthy(result);
  t.is(result.css, less);
  t.is(result.content, less);
});

test('should not parse invalid LESS (#64)', async (t) => {
  const less = '.@{]';

  try {
    await postcss().process(less, { syntax });
  } catch (e) {
    t.true(e instanceof CssSyntaxError);
  }
});

test('should create its own Root node stringifier (#82)', async (t) => {
  const less = '@const "foo.less"';
  const result = await postcss().process(less, { syntax });

  t.is(result.root.toString(), less);
});
