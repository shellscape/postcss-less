const test = require("ava");
const postcss = require("postcss");
const { readFileSync } = require("fs");
const { join } = require("path");

const syntax = require("../lib");

const { parser } = syntax;

// silence the rediculously verbose "You did not set any plugins, parser, or
// stringifier" warnings in PostCSS.
console.warn = () => {}; // eslint-disable-line no-console

test("should parse LESS integration syntax and generate a source map", async t => {
  const less = readFileSync(
    join(__dirname, "./integration/ext.cx.dashboard.less"),
    "utf-8"
  );
  const result = await postcss().process(less, {
    syntax,
    parser,
    map: { inline: false, annotation: false, sourcesContent: true }
  });

  t.truthy(result);
  t.is(result.css, less);
  t.is(result.content, less);
  t.truthy(result.map);
});

test("should parse LESS inline comment syntax and generate a source map", async t => {
  const less = `
  a {
    //background-color: red;
  }
  `;
  const result = await postcss().process(less, {
    syntax,
    parser,
    map: { inline: false, annotation: false, sourcesContent: true }
  });

  t.truthy(result);
  t.is(result.css, less);
  t.is(result.content, less);
  t.truthy(result.map);
});
