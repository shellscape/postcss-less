/* eslint no-param-reassign: off */

const Comment = require('postcss/lib/comment');
const Parser = require('postcss/lib/parser');

const isMixinToken = require('./is-mixin-token');
const importNode = require('./nodes/import');
const variableNode = require('./nodes/variable');

const importantPattern = /(!\s*important)/i;

module.exports = class LessParser extends Parser {
  constructor(...args) {
    super(...args);

    this.lastNode = null;
  }

  atrule(token) {
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
    // TODO: move this into a util function/file
    if (token[0] === 'word' && token[1] === '//') {
      const first = token;
      const bits = [];
      let last;

      while (token && !/\n/.test(token[1])) {
        bits.push(token[1]);
        last = token;
        token = this.tokenizer.nextToken();
      }

      if (token) {
        bits.push(token[1]);
      }

      const newToken = ['comment', bits.join(''), first[2], first[3], last[2], last[3]];

      this.inlineComment(newToken);
      return;
    }

    super.other(token);
  }

  unnamedAtrule(node, token) {
    const first = token;
    const bits = [];
    let last = token;

    token = this.tokenizer.nextToken();

    // TODO: move this into a util function/file
    // dealing with variable interpolation
    if (token[0] === '{') {
      bits.push(last[1]);

      while (token && token[0] !== ':') {
        last = token;
        bits.push(token[1]);
        token = this.tokenizer.nextToken();
      }

      this.tokenizer.back(token);

      const newToken = [
        'word',
        bits.join(''),
        first[2],
        first[3],
        last[4] || last[2],
        last[5] || last[3]
      ];

      this.other(newToken);
    } else {
      super.unnamedAtrule(node, first);
    }
  }

  unknownWord(tokens) {
    const [first] = tokens;

    // TODO: move this into a util function/file
    if (isMixinToken(first)) {
      for (const token of tokens.reverse()) {
        this.tokenizer.back(token);
      }
      this.atrule(this.tokenizer.nextToken());
      this.lastNode.mixin = true;

      if (importantPattern.test(this.lastNode.params)) {
        [this.lastNode.raws.important] = this.lastNode.params.match(importantPattern);
        this.lastNode.important = true;
        this.lastNode.params = this.lastNode.params.replace(importantPattern, '');

        const [spaces] = this.lastNode.params.match(/\s+$/) || [''];
        this.lastNode.raws.between = spaces;
        this.lastNode.params = this.lastNode.params.trim();
      }

      return;
    }

    // NOTE: keep commented for examining unknown structures
    // console.log('unknown', tokens);
    super.unknownWord(tokens);
  }
};
