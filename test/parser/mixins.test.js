const test = require('ava');

const { parse } = require('../../lib');

test('basic', (t) => {
  const params = '(  1, 2, 3; something, else; ...) when (@mode=huge)';
  const selector = `.foo ${ params }`;
  const { first } = parse(`${ selector } { border: baz; }`);

  t.is(first.type, 'rule');
  t.is(first.selector, selector);
  t.is(first.first.prop, 'border');
  t.is(first.first.value, 'baz');
});

test('without body', (t) => {
  const less = '.mixin-name (#FFF);';
  const { first } = parse(less);

  t.is(first.type, 'atrule');
  t.is(first.name, 'mixin-name');
  t.is(first.params, '(#FFF)');
  t.falsy(first.nodes);
});

test('without body, no params', (t) => {
  const { first } = parse('.base { .mixin-name }');

  t.is(first.first.type, 'atrule');
  t.is(first.first.name, 'mixin-name');
  t.falsy(first.params);
  t.falsy(first.first.nodes);
});

test('without body, no params, no whitepsace', (t) => {
  const { first } = parse('.base {.mixin-name}');

  t.is(first.first.type, 'atrule');
  t.is(first.first.name, 'mixin-name');
  t.falsy(first.params);
  t.falsy(first.first.nodes);
});

// TODO: false positive, this is valid standard CSS syntax
// test('simple with params',  async (t) => {
//   const less = '.foo (@bar; @baz...) { border: baz; }';
//   const { first } = parse(less);
//
//   t.is(first.type, 'atrule');
// });

/* eslint-disable no-multiple-empty-lines */
test('class and id selectors', (t) => {
  const less = `
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

  const { nodes: [first, second, last] } = parse(less);

  t.is(first.first.name, 'a');
  t.is(first.first.params, '(#FFF)');

  t.is(second.first.name, 'b');
  t.is(second.first.params, '(@param1; @param2)');

  t.is(last.first.name, 'mixin1');
  t.true(/\(\s+\)/.test(last.first.params));

  t.is(last.nodes[1].name, 'mixin2');
  t.falsy(last.nodes[1].params);
});

test('namespaces', (t) => {
  const less = `
    .c {
      #outer > .inner;
      #space > .importer-1();
    }
`;

  const { first } = parse(less);

  t.is(first.selector, '.c');
  t.is(first.nodes.length, 2);
});

test('guarded namespaces', (t) => {
  const less = `
    #namespace when (@mode=huge) {
      .mixin() { /* */ }
    }

    #namespace {
      .mixin() when (@mode=huge) { /* */ }
    }
`;

  const { first } = parse(less);

  t.is(first.first.selector, '.mixin()');
  t.is(first.next().first.selector, '.mixin() when (@mode=huge)');
});

test('mixins with `!important`', (t) => {
  const less = `
                    .foo() !important;
                `;

  const { first } = parse(less);

  t.is(first.name, 'foo');
  t.is(first.params, '()');
  t.is(first.important, true);
});

test('case-insensitive !important', (t) => {
  const less = `
                    .foo() !IMPoRTant;
                `;

  const { first } = parse(less);

  t.is(first.name, 'foo');
  t.is(first.params, '()');
  t.is(first.important, true);
});

test('!important, no whitespace', (t) => {
  const less = `
                    .foo()!important;
                `;

  const { first }  = parse(less);

  t.is(first.name, 'foo');
  t.is(first.params, '()');
  t.is(first.important, true);
});

test('! important', (t) => {
  const less = `
  .foo() ! important;
  .bar()! important;
`;

  const { first, last }  = parse(less);

  t.is(first.name, 'foo');
  t.is(first.params, '()');
  t.is(first.important, true);

  t.is(last.name, 'bar');
  t.is(last.params, '()');
  t.is(last.important, true);
});

test('parses nested mixins with the rule set', (t) => {
  const params = '({background-color: red;})';
  const ruleSet = `.desktop-and-old-ie ${ params }`;
  const { first }  = parse(`header { ${ ruleSet }; }`);

  t.is(first.selector, 'header');
  t.is(first.first.name, 'desktop-and-old-ie');
  t.is(first.first.params, params);
  t.falsy(first.first.nodes);
});

test('should parse nested mixin', (t) => {
  const less = `
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

  const root = parse(less);

  t.is(root.nodes.length, 3);
});
