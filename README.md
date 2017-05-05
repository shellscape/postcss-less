[PostCSS]: https://github.com/postcss/postcss
[PostCSS-SCSS]: https://github.com/postcss/postcss-scss
[LESS]: http://lesless.org
[Autoprefixer]: https://github.com/postcss/autoprefixer
[Stylelint]: http://stylelint.io/

# PostCSS LESS Syntax [![Build Status](https://img.shields.io/travis/shellscape/postcss-less.svg?branch=develop)](https://travis-ci.org/webschik/postcss-less) [![npm Version](https://img.shields.io/npm/v/postcss-less.svg)](https://www.npmjs.com/package/postcss-less)

[PostCSS] Syntax for parsing [LESS]

<img align="right" width="95" height="95"
     title="Philosopher's stone, logo of PostCSS"
     src="http://postcss.github.io/postcss/logo.svg">

Please note: poscss-less is not a LESS compiler. For compiling LESS, please use
the official toolset for LESS.

## Getting Started

First thing's first, install the module:

```
npm install postcss-less --save-dev
```

## LESS Transformations

The most common use of `postcss-less` is for applying PostCSS transformations
directly to LESS source. eg. ia theme written in LESS which uses [Autoprefixer]
to add appropriate vendor prefixes.

```js
const syntax = require('postcss-less');
postcss(plugins)
  .process(lessText, { syntax: syntax })
  .then(function (result) {
    result.content // LESS with transformations
});
```

## Inline Comments

Parsing of single-line comments in CSS is also supported.

```less
:root {
    // Main theme color
    --color: red;
}
```

Note that you don't need a custom stringifier to handle the output; the default
stringifier will automatically convert single line comments into block comments.
If you need to support inline comments, please use a [custom PostCSSLess stringifier](#stringifier).

## Rule Node

[PostCSS Rule Node](https://github.com/postcss/postcss/blob/master/docs/api.md#rule-node)

### rule.ruleWithoutBody
Determines whether or not a rule has a body, or content.

```js
import postCssLess from 'postcss-less';
const less = `
    .class2 {
        &:extend(.class1);
        .mixin-name(@param1, @param2);
    }
`;
const root = postCssLess.parse(less);

root.first.nodes[0].ruleWithoutBody // => true for &:extend
root.first.nodes[1].ruleWithoutBody // => true for calling of mixin
```
### rule.nodes

An `Array` of child nodes.

**Note** that rules without body don't have this property.

```js
import postCssLess from 'postcss-less';
const less = `
    .class2 {
        &:extend(.class1);
        .mixin-name(@param1, @param2);
    }
`;
const root = postCssLess.parse(less);

root.first.nodes[0].nodes // => undefined for &:extend
root.first.nodes[1].nodes // => undefined for mixin calling
```

### rule.extendRule

Determines whether or not a rule is nested (eg.
 [extended](http://lesscss.org/features/#extend-feature-extend-inside-ruleset)).

```js
import postCssLess from 'postcss-less';
const less = `
    .class2 {
        &:extend(.class1);
    }
`;
const root = postCssLess.parse(less);

root.first.nodes[0].extendRule // => true
```

## Comment Node

[PostCSS Comment Node](https://github.com/postcss/postcss/blob/master/docs/api.md#comment-node)

### comment.inline

Determines whether or not a comment is inline.

```js
import postCssLess from 'postcss-less';

const root = postCssLess.parse('// Hello world');

root.first.inline // => true
```

### comment.block

Determines whether or not a comment is a block comment.

```js
import postCssLess from 'postcss-less';

const root = postCssLess.parse('/* Hello world */');

root.first.block // => true
```

### comment.raws.begin

Precending characters of a comment node. eg. `//` or `/*`.

### comment.raws.content

Raw content of the comment.

```js
import postCssLess from 'postcss-less';

const root = postCssLess.parse('// Hello world');

root.first.raws.content // => '// Hello world'
```

## Stringifying

To process LESS code without PostCSS transformations, custom stringifier
should be provided.

```js
import postcss from 'postcss';
import postcssLess from 'postcss-less';
import stringify from 'postcss-less/less-stringify';

const lessCode = `
    // Non-css comment

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

postcss()
  .process(less, {
    syntax: postcssLess,
    stringifier: stringify
  })
  .then((result) => {
    console.log(result.content); // this will be value of `lessCode` without changing comments or mixins
});
```

## Use Cases

* Lint LESS code with 3rd-party plugins.
* Apply PostCSS transformations (such as [Autoprefixer](https://github.com/postcss/autoprefixer)) directly to the LESS source code

## Contribution

Please, check our guidelines: [CONTRIBUTING.md](./CONTRIBUTING.md)

## Attribution

This module is based on the [postcss-scss](https://github.com/postcss/postcss-scss) library.

[![npm Downloads](https://img.shields.io/npm/dt/postcss-less.svg)](https://www.npmjs.com/package/postcss-less)
[![npm License](https://img.shields.io/npm/l/postcss-less.svg)](https://www.npmjs.com/package/postcss-less)
[![js-strict-standard-style](https://img.shields.io/badge/code%20style-strict-117D6B.svg)](https://github.com/keithamus/eslint-config-strict)
