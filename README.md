# PostCSS LESS Syntax - Work in Progress

[PostCSS]: https://github.com/postcss/postcss
[PostCSS-SCSS]: https://github.com/postcss/postcss-scss
[LESS]: http://lesless.org
[Autoprefixer]: https://github.com/postcss/autoprefixer
[Stylelint]: http://stylelint.io/

> This project is not stable and is in development. If you'd like to contribute, please submit a Pull Request.

<img align="right" width="95" height="95"
     title="Philosopher's stone, logo of PostCSS"
     src="http://postcss.github.io/postcss/logo.svg">

[![Build Status](https://img.shields.io/travis/webschik/postcss-less.svg?branch=develop)](https://travis-ci.org/webschik/postcss-less)
[![npm Downloads](https://img.shields.io/npm/dt/postcss-less.svg)](https://www.npmjs.com/package/postcss-less)
[![npm Version](https://img.shields.io/npm/v/postcss-less.svg)](https://www.npmjs.com/package/postcss-less)
[![npm License](https://img.shields.io/npm/l/postcss-less.svg)](https://www.npmjs.com/package/postcss-less)
[![js-strict-standard-style](https://img.shields.io/badge/code%20style-strict-117D6B.svg)](https://github.com/keithamus/eslint-config-strict)

A [LESS] parser for [PostCSS].

**This module does not compile LESS.** It simply parses mixins and variables so that PostCSS plugins can then transform LESS source code alongside CSS.

## Use Cases

* lint your LESS code with a plugin such as [Stylelint](http://stylelint.io/).
* apply PostCSS transformations (such as [Autoprefixer](https://github.com/postcss/autoprefixer)) directly to the LESS source code

## Usage

### LESS Transformations

The main use case of this plugin is to apply PostCSS transformations directly
to LESS source code. For example, if you ship a theme written in LESS and need
[Autoprefixer] to add the appropriate vendor prefixes to it.

```js
const syntax = require('postcss-less');
postcss(plugins).process(lessText, { syntax: syntax }).then(function (result) {
    result.content // LESS with transformations
});
```

When you want to lint LESS with a plugin such as [Stylelint], you will need to tell `postcss-less` to _fake_ LESS-specific syntax.

```js
const syntax = require('postcss-less');
postcss().process(lessText, { syntax: syntax, mixinsAsAtRules: true }).then(function (result) {
    result.content // LESS with transformations
});
```

### Inline Comments for PostCSS

This module also enables parsing of single-line comments in CSS source code.

```less
:root {
    // Main theme color
    --color: red;
}
```

Note that you don't need a special stringifier to handle the output; the default
one will automatically convert single line comments into block comments.

## Restrictions

### Skipped blocks:
* nested mixins with custom token `nested-mixin`
* nested &:extend(); with custom token `nested-extend`

## Contribution
Please, check our guidelines: [CONTRIBUTING.md](./CONTRIBUTING.md)

## Attribution

This module is based on the work of [postcss-scss](https://github.com/postcss/postcss-scss) library and includes the `LESS` parser efforts of [github:gilt/postcss-less](https://github.com/gilt/postcss-less)
