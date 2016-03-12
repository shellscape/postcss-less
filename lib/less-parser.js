import Comment from 'postcss/lib/comment';
import Parser from 'postcss/lib/parser';
import AtRule from 'postcss/lib/at-rule';

import lessTokenizer from './less-tokenize';

/* eslint max-len: 0 */
const RE_MIXIN_DEF = /^([#.](?:[\w-]|\\(?:[A-Fa-f0-9]{1,6} ?|[^A-Fa-f0-9]))+)\s*\(/;

export default class LessParser extends Parser {
  constructor (input) {
    super(input);
    this.mixins = {};
  }

  tokenize () {
    this.tokens = lessTokenizer(this.input);
  }

  comment (token) {
    if (token[6] === 'inline') {
      const node = new Comment();
      this.init(node, token[2], token[3]);
      node.raws.inline = true;
      node.source.end = { line: token[4], column: token[5] };

      const text = token[1].slice(2);
      if (/^\s*$/.test(text)) {
        node.text = '';
        node.raws.left = text;
        node.raws.right = '';
      } else {
        let match = text.match(/^(\s*)([^]*[^\s])(\s*)$/);
        node.text = match[2];
        node.raws.left = match[1];
        node.raws.right = match[3];
      }
    } else {
      super.comment(token);
    }
  }

  rule (token) {
    super.rule(token);

    if (RE_MIXIN_DEF.test(this.current.source.input.css)) {
      // this.current is the 'rule' node created in super.rule()
      this.current.type = 'mixin';
      this.current.definition = true;
      this.current.params = [];

      /* eslint no-unused-vars: 0 */
      let blockStart = token.findIndex((t) => t[0] === '(');
      let blockEnd = token.findIndex((t) => t[0] === ')');

      token.forEach((tokn) => {
        if (tokn[0] !== 'mixin-param') {
          return;
        }

        let index = token.indexOf(tokn);
        let param = new AtRule();
        let pos = blockStart;
        let prev = this.current.params[this.current.params.length - 1];
        let t;

        param.name = tokn[1].slice(1);
        param.type = 'mixin-param';
        param.source = {
          start: { line: tokn[2], column: tokn[3] },
          input: this.input
        };
        param.raws = { before: '', after: '', between: '' };

        if (tokn[6] && tokn[6] === 'var-dict') {
          param.variableDict = true;
        }

        while (pos < blockEnd) {
          t = token[pos];

          if (t[0] === ';') {
            param.source.end = { line: t[2], column: t[3] };
            param.raws.semicolon = true;
            blockStart = pos + 1;
            break;
          } else if (t[0] === 'space') {
            param.raws.before += t[1];

            if (prev) {
              prev.raws.after += t[1];
            }
          }

          pos += 1;
        }

        // this is the last param in the block
        if (pos === blockEnd) {
          pos = index;
          while (pos < blockEnd) {
            t = token[pos];

            if (t[0] === 'space') {
              param.raws.after += t[1];
            }

            pos += 1;
          }

          param.source.end = { line: tokn[4], column: tokn[5] };
        }

        this.current.params.push(param);
      });
    }
  }
}
