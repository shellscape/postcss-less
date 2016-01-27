# PostCSS LESS syntax
A [LESS](http://lesscss.org/) parser for [PostCSS](https://github.com/postcss/postcss).

This module does not compile LESS. It simply parses mixins as custom at-rules & variables as properties, so that PostCSS plugins can then transform LESS source code alongside CSS.

# Usage

````js
const syntax = require('postcss-less');
postcss(plugins).process(yourLessCode, {syntax: syntax}).then((result) => {
    // result.content - LESS with transformations
});
````

# Problems
* This plugin skips all **inner mixins** and **&:extend()** selector