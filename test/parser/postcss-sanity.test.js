const test = require('ava');
const tests = require('postcss-parser-tests');

const { nodeToString, parse, stringify } = require('../../lib');

tests.each((name, code, json) => {
  // Skip comments.css, because we have an extended Comment node
  if (name === 'comments.css' || name === 'atrule-no-space.css' || name === 'inside.css') {
    return;
  }

  test(`parses ${name}`, (t) => {
    const root = parse(code, { from: name });
    const parsed = tests.jsonify(root);

    t.is(parsed, json);
  });

  if (name === 'bom.css') {
    return; // eslint-disable-line no-useless-return
  }

  test(`stringifies ${name}`, (t) => {
    const root = parse(code);
    let result = '';

    stringify(root, (i) => {
      result += i;
    });

    t.is(result, code);
  });
});

test('parses nested rules', (t) => {
  const root = parse('a { b {} }');

  t.is(root.first.first.selector, 'b');
});

test('parses at-rules inside rules', (t) => {
  const root = parse('a { @media {} }');

  t.is(root.first.first.name, 'media');
});

test('nested media query with import (#103)', (t) => {
  const less = `@media screen {
	@import "basic";
}`;
  const root = parse(less);
  const { first } = root;

  t.is(first.first.name, 'import');
  t.is(nodeToString(root), less);
});

// TODO: fix. likely same issue as #102
// test('detached ruleset (#86)', (t) => {
//   const less = `.test({
// 	.hello {
// 		.test {
// 		}
// 	}
//
// 	.fred {
// 	}
// })`;
//   const root = parse(less);
//   const { first } = root;
//
//   t.is(first.first.name, 'bar');
//   t.is(nodeToString(root), less);
// });
