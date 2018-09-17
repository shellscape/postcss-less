import Comment from 'postcss/lib/comment';
import Declaration from 'postcss/lib/declaration';
import Import from './import';
import Parser from 'postcss/lib/parser';
import AtRule from 'postcss/lib/at-rule';
import Rule from './rule';
import Root from './root';
import findExtendRule from './find-extend-rule';
import isMixinToken from './is-mixin-token';
import lessTokenizer from './less-tokenize';

const blockCommentEndPattern = /\*\/$/;

export default class LessParser extends Parser {

  constructor (input) {
    super(input);
    this.pos = 0;

    this.root = new Root();
    this.current = this.root;
    this.root.source = { input, start: { line: 1, column: 1 } };
  }

  atrule (token) {
    if (token[1] === '@import') {
      this.import(token);
    }
    else {
      this.originAtrule(token);
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

      if (/!\s*important/i.test(node.selector)) {
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
        if (node.urlFunc) {
          node.importPath = tokn[1].replace(/[()]/g, '');
        }
        else {
          directives.push(tokn);
        }
      }
      else if (tokn[0] === 'space') {
        if (directives.length) {
          node.raws.between = tokn[1];
        }
        else if (node.urlFunc) {
          node.raws.beforeUrl = tokn[1];
        }
        else if (node.importPath) {
          if (node.urlFunc) {
            node.raws.afterUrl = tokn[1];
          }
          else {
            node.raws.after = tokn[1];
          }
        }
        else {
          node.raws.afterName = tokn[1];
        }
      }
      else if (tokn[0] === 'word' && tokn[1] === 'url') {
        node.urlFunc = true;
      }
      else {
        if (tokn[0] !== '(' && tokn[0] !== ')') {
          node.importPath = tokn[1];
        }
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
  }

  unknownWord (start) {
    let token = this.tokens[start];
    throw this.input.error('Unknown word', token[2], token[3]);
  }

  emptyRule (token) {
    let node = new Rule();
    this.init(node, token[2], token[3]);
    node.selector = '';
    node.raws.between = '';
    this.current = node;
  }

  loop () {
    let token;
    while ( this.pos < this.tokens.length ) {
      token = this.tokens[this.pos];

      switch ( token[0] ) {

        case 'space':
        case ';':
          this.spaces += token[1];
          break;

        case '}':
          this.end(token);
          break;

        case 'comment':
          this.comment(token);
          break;

        case 'at-word':
          this.atrule(token);
          break;

        case '{':
          this.emptyRule(token);
          break;

        default:
          this.other();
          break;
      }

      this.pos += 1;
    }
    this.endFile();
  }

  originAtrule (token) {
    let node = new AtRule(), last = false, open = false, params = [];
    node.name = token[1].slice(1);
    if ( node.name === '' ) {
      this.unnamedAtrule(node, token);
    }
    this.init(node, token[2], token[3]);

    this.pos += 1;
    while ( this.pos < this.tokens.length ) {
      token = this.tokens[this.pos];

      if ( token[0] === ';' ) {
        node.source.end = { line: token[2], column: token[3] };
        this.semicolon = true;
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
      else {
        params.push(token);
      }

      this.pos += 1;
    }
    if ( this.pos === this.tokens.length ) {
      last = true;
    }

    node.raws.between = this.spacesAndCommentsFromEnd(params);
    if ( params.length ) {
      node.raws.afterName = this.spacesAndCommentsFromStart(params);
      this.raw(node, 'params', params);
      if ( last ) {
        token = params[params.length - 1];
        node.source.end   = { line: token[4], column: token[5] };
        this.spaces       = node.raws.between;
        node.raws.between = '';
      }
    }
    else {
      node.raws.afterName = '';
      node.params         = '';
    }

    if ( open ) {
      node.nodes   = [];
      this.current = node;
    }
  }

  decl (tokens) {
    let node, last, token;
    node = new Declaration();
    this.init(node);

    last = tokens[tokens.length - 1];
    if ( last[0] === ';' ) {
      this.semicolon = true;
      tokens.pop();
    }
    if ( last[4] ) {
      node.source.end = { line: last[4], column: last[5] };
    }
    else {
      node.source.end = { line: last[2], column: last[3] };
    }

    while ( tokens[0][0] !== 'word' ) {
      node.raws.before += tokens.shift()[1];
    }
    node.source.start = { line: tokens[0][2], column: tokens[0][3] };

    node.prop = '';
    while ( tokens.length ) {
      let type = tokens[0][0];
      if ( type === ':' || type === 'space' || type === 'comment' ) {
        break;
      }
      node.prop += tokens.shift()[1];
    }

    node.raws.between = '';

    while ( tokens.length ) {
      token = tokens.shift();

      if ( token[0] === ':' ) {
        node.raws.between += token[1];
        break;
      }
      else {
        node.raws.between += token[1];
      }
    }

    if ( node.prop[0] === '_' || node.prop[0] === '*' ) {
      node.raws.before += node.prop[0];
      node.prop = node.prop.slice(1);
    }
    node.raws.between += this.spacesAndCommentsFromStart(tokens);
    this.precheckMissedSemicolon(tokens);

    for ( let i = tokens.length - 1; i > 0; i-- ) {
      token = tokens[i];
      if ( token[1] === '!important' ) {
        node.important = true;
        let string = this.stringFrom(tokens, i);
        string = this.spacesFromEnd(tokens) + string;
        if ( string !== ' !important' ) node.raws.important = string;
        break;

      }
      else if (token[1] === 'important') {
        let cache = tokens.slice(0), str = '';
        for ( let j = i; j > 0; j-- ) {
          let type = cache[j][0];
          if ( str.trim().indexOf('!') === 0 && type !== 'space' ) {
            break;
          }
          str = cache.pop()[1] + str;
        }
        if ( str.trim().indexOf('!') === 0 ) {
          node.important = true;
          node.raws.important = str;
          tokens = cache;
        }
      }

      if ( token[0] !== 'space' && token[0] !== 'comment' ) {
        break;
      }
    }

    this.raw(node, 'value', tokens);

    if ( node.value.indexOf(':') !== -1 ) this.checkMissedSemicolon(tokens);
  }

    /* eslint-enable max-statements, complexity */
}
