const test = require('ava');

const parse = require('../../lib/less-parse');

test('parses basic mixins', (t) => {
  const params = '(  1, 2, 3; something, else; ...) when (@mode=huge)';
  const selector = `.foo ${ params }`;
  const root = parse(`${ selector } { border: @{baz}; }`);

  t.is(root.first.type, 'rule', 'Basic mixin. Invalid node type');
  t.is(root.first.selector, selector, 'Basic mixin. Invalid selector');
  t.is(root.first.params, params, 'Basic mixin. Invalid params');
  t.is(root.first.first.prop, 'border');
  t.is(root.first.first.value, '@{baz}');
});

test('mixin without body #1', (t) => {
  const less = '.mixin-name (#FFF);';
  const root = parse(less);

  t.is(root.first.type, 'rule');
  t.is(root.first.selector, '.mixin-name (#FFF)');
  t.is(root.first.params, '(#FFF)');
  t.is(root.first.empty, true);
  t.falsy(root.first.nodes);
  t.is(root.first.toString(), '.mixin-name (#FFF);');
});

test('mixin without body #2', (t) => {
  const root = parse('.base { .mixin-name }');

  t.is(root.first.first.type, 'rule');
  t.is(root.first.first.selector, '.mixin-name');
  t.falsy(root.first.params);
  t.is(root.first.first.empty, true);
  t.falsy(root.first.first.nodes);
});

test('mixin without body and without whitespace #2', (t) => {
  const root = parse('.base {.mixin-name}');

  t.is(root.first.first.type, 'rule');
  t.is(root.first.first.selector, '.mixin-name');
  t.falsy(root.first.params);
  t.is(root.first.first.empty, true);
  t.falsy(root.first.first.nodes);
});

/* eslint-disable no-multiple-empty-lines */
test('parses nested mixins with class and id selectors', (t) => {
  const code = `
    .mixin-class {
      .a(#FFF);
    }
    .mixin-id {
      #b (@param1; @param2);
    }

    .class {
      .mixin1 (


      )


      ;

      .mixin2
    }
`;

  const root = parse(code);

  t.is(root.nodes[0].first.selector, '.a(#FFF)', '.a: invalid selector');
  t.is(root.nodes[0].first.params, '(#FFF)', '.a: invalid params');

  t.is(root.nodes[1].first.selector, '#b (@param1; @param2)', '#b: invalid selector');
  t.is(root.nodes[1].first.params, '(@param1; @param2)', '#b: invalid params');

  t.true(/\.mixin1\s\(\s+\)/.test(root.nodes[2].nodes[0].selector),
    '.mixin1: invalid selector'
  );
  t.true(/\(\s+\)/.test(root.nodes[2].nodes[0].params), '.mixin1: invalid params');

  t.is(root.nodes[2].nodes[1].selector, '.mixin2', '.mixin2: invalid selector');
  t.falsy(root.nodes[2].nodes[1].params, '.mixin2: invalid params');
});

test('parses nested mixins with namespaces', (t) => {
  const code = `
    .c {
      #outer > .inner;
      #space > .importer-1();
    }
`;

  const root = parse(code);

  t.is(root.first.selector, '.c');
  t.is(root.first.nodes.length, 2);
});

test('parses nested mixins with guarded namespaces', (t) => {
  const code = `
    #namespace when (@mode=huge) {
      .mixin() { /* */ }
    }

    #namespace {
      .mixin() when (@mode=huge) { /* */ }
    }
`;

  const root = parse(code);

  t.is(root.nodes[0].first.selector, '.mixin()');
  t.is(root.nodes[1].first.selector, '.mixin() when (@mode=huge)');
});

test('parses nested mixins with `!important`', (t) => {
  const code = `
                    .foo() !important;
                `;

  const root = parse(code);

  t.is(root.first.selector, '.foo()');
  t.is(root.first.important, true);
});

test('parses nested mixins with `!important` - insensitive to casing', (t) => {
  const code = `
                    .foo() !IMPoRTant;
                `;

  const root = parse(code);

  t.is(root.first.selector, '.foo()');
  t.is(root.first.important, true);
});

test('parses nested mixins with `!important` - appended without whitespace', (t) => {
  const code = `
                    .foo()!important;
                `;

  const root = parse(code);

  t.is(root.first.selector, '.foo()');
  t.is(root.first.important, true);
});

test('parses nested mixins with `! important`', (t) => {
  const code = `
                    .foo() ! important;
                    .bar()! important;
                `;

  const root = parse(code);

  t.is(root.first.selector, '.foo()');
  t.is(root.first.important, true);
  t.is(root.first.raws.important, ' ! important');

  t.is(root.last.selector, '.bar()');
  t.is(root.last.important, true);
  t.is(root.last.raws.important, '! important');
});

test('parses nested mixins with the rule set', (t) => {
  const params = '({background-color: red;})';
  const ruleSet = `.desktop-and-old-ie ${ params }`;
  const root = parse(`header { ${ ruleSet }; }`);

  t.is(root.first.selector, 'header');
  t.is(root.first.first.selector, ruleSet);
  t.is(root.first.first.params, params, 'Mixin rule set. Invalid params');
  t.is(root.first.first.empty, true);
  t.falsy(root.first.first.nodes);
});

test('should parse nested mixin', (t) => {
  const code = `
  .badge-quality {
    &:extend(.label, .m_text-uppercase);
    font-size: 85%;
    font-weight: normal;
    min-width: 2rem;
    height: 2rem;
    padding: 0.2rem 0.3rem;
    display: inline-block;
    border-radius: 0;
    cursor: default;
    line-height: 1.6rem;
    color: @c_white;
    background-color: @c_blue1;

    &_info {
      background-color: @c_blue5;
    }

    &_danger {
      background-color: @c_red2;
    }

    &_success {
      background-color: @c_green3;
    }

    &_warning {
      background-color: @c_yellow1;
      color: @c_black1;
    }
  }

  .badge-category {
    &:extend(.m_badge-default);
  }

  .buy-sell-badge {
    .m_text-uppercase();

    &_buy {
      &:extend(.m_text-success);
    }

    &_sell {
      &:extend(.m_text-error);
    }
  }
`;

  const root = parse(code);

  t.is(root.nodes.length, 3);
});
