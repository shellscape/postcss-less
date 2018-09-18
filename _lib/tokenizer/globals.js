
// TODO: this is ugly, fix this
module.exports = {};

module.exports.singleQuote = '\''.charCodeAt(0);
module.exports.doubleQuote = '"'.charCodeAt(0);
module.exports.backslash = '\\'.charCodeAt(0);
module.exports.backTick = '`'.charCodeAt(0);
module.exports.slash = '/'.charCodeAt(0);
module.exports.newline = '\n'.charCodeAt(0);
module.exports.space = ' '.charCodeAt(0);
module.exports.feed = '\f'.charCodeAt(0);
module.exports.tab = '\t'.charCodeAt(0);
module.exports.carriageReturn = '\r'.charCodeAt(0);
module.exports.openedParenthesis = '('.charCodeAt(0);
module.exports.closedParenthesis = ')'.charCodeAt(0);
module.exports.openedCurlyBracket = '{'.charCodeAt(0);
module.exports.closedCurlyBracket = '}'.charCodeAt(0);
module.exports.openSquareBracket = '['.charCodeAt(0);
module.exports.closeSquareBracket = ']'.charCodeAt(0);
module.exports.semicolon = ';'.charCodeAt(0);
module.exports.asterisk = '*'.charCodeAt(0);
module.exports.colon = ':'.charCodeAt(0);
module.exports.comma = ','.charCodeAt(0);
module.exports.dot = '.'.charCodeAt(0);
module.exports.atRule = '@'.charCodeAt(0);
module.exports.tilde = '~'.charCodeAt(0);
module.exports.hash = '#'.charCodeAt(0);


module.exports.atEndPattern = /[ \n\t\r\f\{\(\)'"\\;/\[\]#!]/g;
module.exports.wordEndPattern = /[ \n\t\r\f\(\)\{\}:,;@!'"\\\]\[#]|\/(?=\*)/g;
module.exports.badBracketPattern = /.[\\\/\("'\n]/;

module.exports.pageSelectorPattern = /^@page[^\w-]+/;
module.exports.variableSpaceColonPattern = /^\s*:/;
module.exports.variablePattern = /^@[^:\(\{]+:/;
module.exports.hashColorPattern = /^#[0-9a-fA-F]{6}$|^#[0-9a-fA-F]{3}$/;
