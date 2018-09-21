/* eslint no-param-reassign: off */

const Comment = require('postcss/lib/comment');
const Parser = require('postcss/lib/parser');

const { isInlineComment } = require('./nodes/inline-comment');
const { interpolation } = require('./nodes/interpolation');
const { isMixinToken } = require('./nodes/mixin');
const importNode = require('./nodes/import');
const variableNode = require('./nodes/variable');

const importantPattern = /(!\s*important)$/i;

module.exports = class LessParser extends Parser {
  constructor(...args) {
    super(...args);

    this.lastNode = null;
  }

  atrule(token) {
    if (interpolation.bind(this)(token)) {
      return;
    }

    super.atrule(token);
    importNode(this.lastNode);
    variableNode(this.lastNode);
  }

  init(node, line, column) {
    super.init(node, line, column);
    this.lastNode = node;
  }

  inlineComment(token) {
    const node = new Comment();
    const text = token[1].slice(2);

    this.init(node, token[2], token[3]);

    node.source.end = { line: token[4], column: token[5] };
    node.inline = true;
    node.raws.begin = '//';

    if (/^\s*$/.test(text)) {
      node.text = '';
      node.raws.left = text;
      node.raws.right = '';
    } else {
      const match = text.match(/^(\s*)([^]*[^\s])(\s*)$/);
      [, node.raws.left, node.text, node.raws.right] = match;
    }
  }

  other(token) {
    if (!isInlineComment.bind(this)(token)) {
      super.other(token);
    }
  }

  rule(tokens) {
    const last = tokens[tokens.length - 1];
    const prev = tokens[tokens.length - 2];

    if (prev[0] === 'at-word' && last[0] === '{') {
      this.tokenizer.back(last);
      if (interpolation.bind(this)(prev)) {
        const newToken = this.tokenizer.nextToken();

        tokens = tokens.slice(0, tokens.length - 2).concat([newToken]);

        for (const tokn of tokens.reverse()) {
          this.tokenizer.back(tokn);
        }

        return;
      }
    }

    super.rule(tokens);
  }

  unknownWord(tokens) {
    const [first] = tokens;

    // TODO: move this into a util function/file
    if (isMixinToken(first)) {
      const identifier = first[1].slice(0, 1);
      const bracketsIndex = tokens.findIndex((t) => t[0] === 'brackets');
      const firstParenIndex = tokens.findIndex((t) => t[0] === '(');
      let important = '';

      // fix for #86. if rulesets are mixin params, they need to be converted to a brackets token
      if (bracketsIndex < 0 && firstParenIndex > 0) {
        const lastParenIndex = tokens.findIndex((t) => t[0] === ')');

        const contents = tokens.slice(firstParenIndex, lastParenIndex + firstParenIndex);
        const brackets = contents.map((t) => t[1]).join('');
        const [paren] = tokens.slice(firstParenIndex);
        const start = [paren[2], paren[3]];
        const [last] = tokens.slice(lastParenIndex, lastParenIndex + 1);
        const end = [last[2], last[3]];
        const newToken = ['brackets', brackets].concat(start, end);

        const tokensBefore = tokens.slice(0, firstParenIndex);
        const tokensAfter = tokens.slice(lastParenIndex + 1);
        tokens = tokensBefore;
        tokens.push(newToken);
        tokens = tokens.concat(tokensAfter);
      }

      const importantIndex = tokens.findIndex((t) => importantPattern.test(t[1]));

      if (importantIndex > 0) {
        [, important] = tokens[importantIndex];
        tokens.splice(importantIndex, 1);
      }

      for (const token of tokens.reverse()) {
        this.tokenizer.back(token);
      }

      this.atrule(this.tokenizer.nextToken());
      this.lastNode.mixin = true;
      this.lastNode.raws.identifier = identifier;

      // const importantIndex = tokens.findIndex((t) => importantPattern.test(t[1]));

      if (important) {
        this.lastNode.important = true;
        this.lastNode.raws.important = important;
      }

      // if (importantIndex > 0) {
      //   nodes.splice(importantIndex, 1);
      // [this.lastNode.raws.important] = this.lastNode.params.match(importantPattern);

      // this.lastNode.params = this.lastNode.params.replace(importantPattern, '');

      // const [spaces] = this.lastNode.params.match(/\s+$/) || [''];
      // this.lastNode.raws.between = spaces;
      // this.lastNode.params = this.lastNode.params.trim();
      // }

      return;
    }
    // NOTE: keep commented for examining unknown structures
    // console.log('unknown', tokens);
    super.unknownWord(tokens);
  }
};
