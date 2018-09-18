const Comment = require('postcss/lib/comment');
const Parser = require('postcss/lib/parser');

const importNode = require('./nodes/import');
const variableNode = require('./nodes/variable');

module.exports = class LessParser extends Parser {
  constructor (...args) {
    super(...args);

    this.lastNode = null;
  }

  init (node, line, column) {
    super.init(node, line, column);
    this.lastNode = node;
  }

  atrule (token) {
    super.atrule(token);
    importNode(this.lastNode);
    variableNode(this.lastNode);
  }

  inlineComment (token) {
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
    }
    else {
      let match = text.match(/^(\s*)([^]*[^\s])(\s*)$/);
      node.text = match[2];
      node.raws.left = match[1];
      node.raws.right = match[3];
    }
  }

  other (token) {
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

  unnamedAtrule (node, token) {
    const first = token;
    const bits = [];
    let last = token;

    token = this.tokenizer.nextToken();

    // dealing with variable interpolation
    if (token[0] === '{') {
      bits.push(last[1]);

      while (token && token[0] !== ':') {
        last = token;
        bits.push(token[1]);
        token = this.tokenizer.nextToken();
      }

      this.tokenizer.back(token);

      const newToken = ['word', bits.join(''), first[2], first[3], last[4] || last[2], last[5] || last[3]];

      this.other(newToken);
    }
    else {
      super.unnamedAtrule(node, unnamedToken);
    }
  }

  // NOTE: keep commented for examining unknown structures
  // unknownWord (tokens) {
  //   console.log('unknown', tokens);
  // }
};
