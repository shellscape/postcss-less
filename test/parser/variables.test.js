const test = require('ava');

const fs = require('fs');
const path = require('path');

const parse = require('../../lib/less-parse');

test('parses numeric variables', (t) => {
  const root = parse('@var: 1;');

  t.is(root.first.prop, '@var');
  t.is(root.first.value, '1');
});

// sanity check - issue #99
test('should not fail wikimedia sanity check', (t) => {
  const code = fs.readFileSync(path.join(__dirname, '../integration/ext.cx.dashboard.less'), 'utf-8');
  const root = parse(code);

  t.is(root.first.type, 'import');
});

// #98 was merged to resolve this but broke other scenarios
test('parses variables with whitespaces between name and ":"', (t) => {
  let root = parse('@onespace : 42;');

  t.is(root.first.prop, '@onespace');
  t.is(root.first.value, '42');
});

// #98 was merged to resolve this but broke other scenarios
// these tests are commented out until that is resolved
test('parses variables with no whitespace between ":" and value', (t) => {
  const root = parse('@var :42;');

  t.is(root.first.prop, '@var');
  t.is(root.first.value, '42');
});

test('parses mutliple variables with whitespaces between name and ":"', (t) => {
  const root = parse('@foo  : 42; @bar : 35;');

  t.is(root.first.prop, '@foo');
  t.is(root.first.value, '42');
  t.is(root.nodes[1].prop, '@bar');
  t.is(root.nodes[1].value, '35');
});

test('parses multiple variables with no whitespace between ":" and value', (t) => {
  const root = parse('@foo  :42; @bar :35');

  t.is(root.first.prop, '@foo');
  t.is(root.first.value, '42');
  t.is(root.nodes[1].prop, '@bar');
  t.is(root.nodes[1].value, '35');
});

test('parses @pagexxx like variable but not @page selector', (t) => {
  const root = parse('@pageWidth: "test";');

  t.is(root.first.prop, '@pageWidth');
  t.is(root.first.value, '"test"');

  const root2 = parse('@page-width: "test";');

  t.is(root2.first.prop, '@page-width');
  t.is(root2.first.value, '"test"');
});

test('parses @pagexxx like variable with whitespaces between name and ":"', (t) => {
  const root = parse('@pageWidth :"test";');

  t.is(root.first.prop, '@pageWidth');
  t.is(root.first.value, '"test"');

  const root2 = parse('@page-width :"test";');

  t.is(root2.first.prop, '@page-width');
  t.is(root2.first.value, '"test"');

  const root3 = parse('@page-width : "test";');

  t.is(root3.first.prop, '@page-width');
  t.is(root3.first.value, '"test"');
});

test('parses string variables', (t) => {
  const root = parse('@var: "test";');

  t.is(root.first.prop, '@var');
  t.is(root.first.value, '"test"');
});

test('parses mixed variables', (t) => {
  const propValue = '(   \n( ((@line-height))) * (@lines-to-show) )em';
  const root = parse(`h1 { max-height: ${ propValue }; }`);

  t.is(root.first.selector, 'h1');
  t.is(root.first.first.prop, 'max-height');
  t.is(root.first.first.value, propValue);
});

test('parses color (hash) variables', (t) => {
  const root = parse('@var: #fff;');

  t.is(root.first.prop, '@var');
  t.is(root.first.value, '#fff');
});

test('parses interpolation', (t) => {
  const root = parse('@{selector}:hover { @{prop}-size: @{color} }');

  t.is(root.first.selector, '@{selector}:hover');
  t.is(root.first.first.prop, '@{prop}-size');
  t.is(root.first.first.value, '@{color}');
});

test('parses interpolation inside word', (t) => {
  const root = parse('.@{class} {}');

  t.is(root.first.selector, '.@{class}');
});

test('parses escaping', (t) => {
  const code = `
    .m_transition (...) {
      @props: ~\`"@{arguments}".replace(/[\[\]]/g, '')\`;
      @var: ~ a;
      -webkit-transition: @props;
      -moz-transition: @props;
      -o-transition: @props;
      transition: @props;
    }

    .a {
      & ~ .stock-bar__content .stock-bar__control_pause {
        display: none;
      }
    }
`;

  const root = parse(code);

  t.is(root.first.selector, '.m_transition (...)');
  t.is(root.first.first.prop, '@props');
  t.is(root.first.first.value, '~`"@{arguments}".replace(/[\[\]]/g, \'\')`');
  t.is(root.nodes[1].first.selector, '& ~ .stock-bar__content .stock-bar__control_pause');
});
