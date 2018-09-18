const Comment = require('postcss/lib/comment');
const Import = require('./import');
const Parser = require('postcss/lib/parser');
const Rule = require('./Rule');
const Root = require('./Root');
const findExtendRule = require('./find-extend-rule');
const isMixinToken = require('./is-mixin-token');
const lessTokenizer = require('./less-tokenize');

const blockCommentEndPattern = /\*\/$/;
const importantPattern = /(!\s*important)/i;

module.exports = class LessParser extends Parser {

  constructor (input) {
    super(input);

    this.root = new Root();
    this.current = this.root;
    this.root.source = { input, start: { line: 1, column: 1 } };
  }

  atrule (token) {
    if (token[1] === '@import') {
      this.import(token);
    }
    else {
      super.atrule(token);
    }
  }

  comment (token) {
    const node = new Comment();
    const content = token[1];
    const text = content.slice(2).replace(blockCommentEndPattern, '');

    this.init(node, token[2], token[3]);
    node.source.end = {
      line: token[4],
      column: token[5]
    };

    node.raws.content = content;
    node.raws.begin = content[0] + content[1];
    node.inline = token[6] === 'inline';
    node.block = !node.inline;

    if (/^\s*$/.test(text)) {
      node.text = '';
      node.raws.left = text;
      node.raws.right = '';
    }
    else {
      const match = text.match(/^(\s*)([^]*[^\s])(\s*)$/);

      node.text = match[2];

      // Add extra spaces to generate a comment in a common style /*[space][text][space]*/
      node.raws.left = match[1] || ' ';
      node.raws.right = match[3] || ' ';
    }
  }

  /**
   * @description Create a Declaration
   * @param options {{start: number}}
   */
  createDeclaration (options) {
    const tokens = this.tokens.slice(options.start, this.pos + 1);

    // fixes #89. PostCSS v5.x doesn't account for non-lowercase !important
    // TODO: check v7.x once we migrate to see if this can be removed
    for (const token of tokens) {
      if (importantPattern.test(token[1])) {
        token[1] = token[1].replace(importantPattern, '$1').toLowerCase();
      }
    }

    this.decl(tokens);
  }

  /**
   * @description Create a Rule node
   * @param options {{start: number, params: Array}}
   */
  createRule (options) {

    const semi = this.tokens[this.pos][0] === ';';
    const end = this.pos + (options.empty && semi ? 2 : 1);
    const tokens = this.tokens.slice(options.start, end);
    const node = this.rule(tokens);

    /**
     * By default in PostCSS `Rule.params` is `undefined`.
     * To preserve compability with PostCSS:
     *  - Don't set empty params for a Rule.
     *  - Set params for a Rule only if it can be a mixin or &:extend rule.
     */
    if (options.params[0] && (options.mixin || options.extend)) {
      this.raw(node, 'params', options.params);
    }

    if (options.empty) {
      // if it's an empty mixin or extend, it must have a semicolon
      // (that's the only way we get to this point)
      if (semi) {
        node.raws.semicolon = this.semicolon = true;
        node.selector = node.selector.replace(/;$/, '');
      }

      if (options.extend) {
        node.extend = true;
      }

      if (options.mixin) {
        node.mixin = true;
      }

      /**
       * @description Mark mixin without declarations.
       * @type {boolean}
       */
      node.empty = true;

      // eslint-disable-next-line
      delete this.current.nodes;

      if (importantPattern.test(node.selector)) {
        node.important = true;

        if (/\s*!\s*important/i.test(node.selector)) {
          node.raws.important = node.selector.match(/(\s*!\s*important)/i)[1];
        }

        node.selector = node.selector.replace(/\s*!\s*important/i, '');
      }

      // rules don't have trailing semicolons in vanilla css, so they get
      // added to this.spaces by the parser loop, so don't step back.
      if (!semi) {
        this.pos--;
      }

      this.end(this.tokens[this.pos]);
    }
  }

  end (token) {
    const node = this.current;

    // if a Rule contains other Rules (mixins, extends) and those have
    // semicolons, assert that the parent Rule has a semicolon
    if (node.nodes && node.nodes.length && node.last.raws.semicolon && !node.last.nodes) {
      this.semicolon = true;
    }

    super.end(token);
  }

  import (token) {
    const node = new Import();
    const directives = [];

    let last = false,
      open = false,
      filename = [];

    node.name = token[1].slice(1);

    this.init(node, token[2], token[3]);

    this.pos += 1;

    while ( this.pos < this.tokens.length ) {
      token = this.tokens[this.pos];

      if ( token[0] === ';' ) {
        node.source.end = { line: token[2], column: token[3] };
        node.raws.semicolon = true;
        break;
      }
      else if ( token[0] === '{' ) {
        open = true;
        break;
      }
      else if ( token[0] === '}') {
        this.end(token);
        break;
      }
      else if (token[0] === 'brackets') {
        if (node.urlFunc) {
          token[1] = token[1].replace(/[()]/g, '');
          filename.push(token);
        }
        else {
          directives.push(token);
        }
      }
      else if (token[0] === '(') {
        if (node.urlFunc) {
          filename.push(this.tokens[this.pos + 1]);
          this.pos += 2;
        }
      }
      else if (token[0] === 'space') {
        if (directives.length && !node.raws.between) {
          node.raws.between = token[1];
        }
        else if (node.urlFunc && !node.raws.beforeUrl) {
          node.raws.beforeUrl = token[1];
        }
        else if (filename.length) {
          if (node.urlFunc && !node.raws.afterUrl) {
            node.raws.afterUrl = token[1];
          }
          else if (this.pos + 1 === this.tokens.length) {
            node.raws.after = token[1];
          }
          else {
            filename.push(token);
          }
        }
        else if (!node.raws.afterName) {
          node.raws.afterName = token[1];
        }
        else {
          filename.push(token);
        }
      }
      else if (token[0] === 'word' && token[1] === 'url') {
        node.urlFunc = true;
      }
      else {
        filename.push(token);
      }

      this.pos += 1;
    }

    if (this.pos === this.tokens.length) {
      last = true;
    }

    if (directives.length) {
      this.raw(node, 'directives', directives);
    }
    else {
      node.directives = '';
    }

    if (filename.length) {
      if (!directives.length && node.raws.afterName && node.raws.between) {
        node.raws.afterName = '';
      }

      this.raw(node, 'filename', filename);
    }
    else {
      node.filename = '';
    }

    if ( open ) {
      node.nodes = [];
      this.current = node;
    }
  }

  /* eslint-disable max-statements, complexity */
  other () {
    const brackets = [];
    const params = [];
    const start = this.pos;

    let end = false,
      colon = false,
      bracket = null;

    // we need pass "()" as spaces
    // However we can override method Parser.loop, but it seems less maintainable
    if (this.tokens[start][0] === 'brackets') {
      this.spaces += this.tokens[start][1];
      return;
    }

    const mixin = isMixinToken(this.tokens[start]);
    const extend = Boolean(findExtendRule(this.tokens, start));

    while (this.pos < this.tokens.length) {
      const token = this.tokens[this.pos];
      const type = token[0];

      if (type === '(' || type === '[') {
        if (!bracket) {
          bracket = token;
        }

        brackets.push(type === '(' ? ')' : ']');

      }
      else if (brackets.length === 0) {
        if (type === ';') {
          const foundEndOfRule = this.ruleEnd({
            start,
            params,
            colon,
            mixin,
            extend
          });

          if (foundEndOfRule) {
            return;
          }

          break;
        }
        else if (type === '{') {
          this.createRule({ start, params, mixin });
          return;
        }
        else if (type === '}') {
          this.pos -= 1;
          end = true;
          break;
        }
        else if (type === ':') {
          colon = true;
        }
      }
      else if (type === brackets[brackets.length - 1]) {
        brackets.pop();
        if (brackets.length === 0) {
          bracket = null;
        }
      }

      // we don't want to add params for pseudo-selectors that utilize parens (#56)
      // if ((extend || !colon) && (brackets.length > 0 || type === 'brackets' || params[0])) {
      //   params.push(token);
      // }

      // we don't want to add params for pseudo-selectors that utilize parens (#56) or bracket selectors (#96)
      if ((extend || !colon) && (brackets.length > 0 || type === 'brackets' || params[0]) && brackets[0] !== ']') {
        params.push(token);
      }

      this.pos += 1;
    }

    if (this.pos === this.tokens.length) {
      this.pos -= 1;
      end = true;
    }

    if (brackets.length > 0) {
      this.unclosedBracket(bracket);
    }

    // dont process an end of rule if there's only one token and it's unknown (#64)
    if (end && this.tokens.length > 1) {
      // Handle the case where the there is only a single token in the end rule.
      if (start === this.pos) {
        this.pos += 1;
      }

      const foundEndOfRule = this.ruleEnd({
        start,
        params,
        colon,
        mixin,
        extend,
        isEndOfBlock: true
      });

      if (foundEndOfRule) {
        return;
      }
    }

    this.unknownWord(start);
  }

  rule (tokens) {
    tokens.pop();

    const node = new Rule();

    this.init(node, tokens[0][2], tokens[0][3]);

    //node.raws.between = this.spacesFromEnd(tokens);
    node.raws.between = this.spacesAndCommentsFromEnd(tokens);

    this.raw(node, 'selector', tokens);
    this.current = node;

    return node;
  }

  ruleEnd (options) {
    const { start } = options;

    if (options.extend || options.mixin) {
      this.createRule(Object.assign(options, { empty: true }));
      return true;
    }

    if (options.colon) {
      if (options.isEndOfBlock) {
        while (this.pos > start) {
          const token = this.tokens[this.pos][0];

          if (token !== 'space' && token !== 'comment') {
            break;
          }

          this.pos -= 1;
        }
      }

      this.createDeclaration({ start });
      return true;
    }

    return false;
  }

  tokenize () {
    this.tokens = lessTokenizer(this.input);

    console.log(this.tokens);
  }

  /* eslint-enable max-statements, complexity */
};
