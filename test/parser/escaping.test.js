const test = require('ava');

const parse = require('../../lib/less-parse');

test('parses escaped string', (t) => {
  const code = `
  @testVar: 10px;

  .test-wrap {
    .selector {
      height: calc(~"100vh - @{testVar}");
    }
  }
`;
  const root = parse(code);

  t.is(root.first.prop, '@testVar');
  t.is(root.first.value, '10px');
  t.is(root.last.first.first.prop, 'height');
  t.is(root.last.first.first.value, 'calc(~"100vh - @{testVar}")');
});

test('parses escaping inside nested rules', (t) => {
  const code = `
  .test1 {
    .another-test {
      prop1: function(~"@{variable}");
    }
  }

  .test2 {
    prop2: function(~\`@{test}\`);
  }

  .test3 {
    filter: ~"alpha(opacity='@{opacity}')";
  }
`;
  const root = parse(code);

  t.is(root.nodes[0].first.first.prop, 'prop1');
  t.is(root.nodes[0].first.first.value, 'function(~"@{variable}")');
  t.is(root.nodes[1].first.prop, 'prop2');
  t.is(root.nodes[1].first.value, 'function(~`@{test}`)');
  t.is(root.nodes[2].first.prop, 'filter');
  t.is(root.nodes[2].first.value, '~"alpha(opacity=\'@{opacity}\')"');
});
