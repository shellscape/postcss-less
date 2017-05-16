import Comment from 'postcss/lib/comment';
import Import from './import';
import Parser from 'postcss/lib/parser';
import Rule from './rule';
import findExtendRule from './find-extend-rule';
import isMixinToken from './is-mixin-token';
import lessTokenizer from './less-tokenize';

const blockCommentEndPattern = /\*\/$/;

export default class LessParser extends Parser {

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
    this.decl(this.tokens.slice(options.start, this.pos + 1));
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

      if (node.selector.indexOf('!important') >= 0) {
        node.important = true;
        node.selector = node.selector.replace(/\s!important/, '');
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
        /* eslint complexity: 0 */
    let last = false,
      open = false,
      end = { line: 0, column: 0 };

    const directives = [];
    const node = new Import();

    node.name = token[1].slice(1);

    this.init(node, token[2], token[3]);

    this.pos += 1;

    while (this.pos < this.tokens.length) {
      const tokn = this.tokens[this.pos];

      if (tokn[0] === ';') {
        end = { line: tokn[2], column: tokn[3] };
        node.raws.semicolon = true;
        break;
      }
      else if (tokn[0] === '{') {
        open = true;
        break;
      }
      else if (tokn[0] === '}') {
        this.end(tokn);
        break;
      }
      else if (tokn[0] === 'brackets') {
        directives.push(tokn);
      }
      else if (tokn[0] === 'space') {
        if (directives.length) {
          node.raws.between = tokn[1];
        }
        else if (node.importPath) {
          node.raws.after = tokn[1];
        }
        else {
          node.raws.afterName = tokn[1];
        }
      }
      else {
        node.importPath = tokn[1];
      }

      if (this.pos === this.tokens.length) {
        last = true;
        break;
      }

      this.pos += 1;
    }

    if (node.raws.between && !node.raws.afterName) {
      node.raws.afterName = node.raws.between;
      node.raws.between = '';
    }

    node.source.end = end;

    if (directives.length) {
      this.raw(node, 'directives', directives);

      if (last) {
        token = directives[directives.length - 1];
        node.source.end = { line: token[4], column: token[5] };
        this.spaces = node.raws.between;
        node.raws.between = '';
      }
    }
    else {
      node.directives = '';
    }

    if (open) {
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
      if ((extend || !colon) && (brackets.length > 0 || type === 'brackets' || params[0])) {
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
  }

    /* eslint-enable max-statements, complexity */
}
