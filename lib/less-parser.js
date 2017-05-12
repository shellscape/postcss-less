import Comment from 'postcss/lib/comment';
import Import from './import';
import Parser from 'postcss/lib/parser';
import Rule from './rule';
import findExtendRule from './find-extend-rule';
import isMixinToken from './is-mixin-token';
import lessTokenizer from './less-tokenize';

const blockCommentEndPattern = /\*\/$/;

export default class LessParser extends Parser {
    tokenize () {
        this.tokens = lessTokenizer(this.input);
    }

    atrule (token) {
        if (token[1] === '@import') {
            this.import(token);
        } else {
            super.atrule(token);
        }
    }

    import (token) {
        /* eslint complexity: 0 */
        let last = false;
        let open = false;
        let end = {line: 0, column: 0};

        const directives = [];
        const node = new Import();

        node.name = token[1].slice(1);

        this.init(node, token[2], token[3]);

        this.pos += 1;

        while (this.pos < this.tokens.length) {
            const tokn = this.tokens[this.pos];

            if (tokn[0] === ';') {
                end = {line: tokn[2], column: tokn[3]};
                node.raws.semicolon = true;
                break;
            } else if (tokn[0] === '{') {
                open = true;
                break;
            } else if (tokn[0] === '}') {
                this.end(tokn);
                break;
            } else if (tokn[0] === 'brackets') {
                directives.push(tokn);
            } else if (tokn[0] === 'space') {
                if (directives.length) {
                    node.raws.between = tokn[1];
                } else if (node.importPath) {
                    node.raws.after = tokn[1];
                } else {
                    node.raws.afterName = tokn[1];
                }
            } else {
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
                node.source.end = {line: token[4], column: token[5]};
                this.spaces = node.raws.between;
                node.raws.between = '';
            }
        } else {
            node.directives = '';
        }

        if (open) {
            node.nodes = [];
            this.current = node;
        }
    }

    rule (tokens) {
        tokens.pop();

        const node = new Rule();

        this.init(node, tokens[0][2], tokens[0][3]);
        node.raws.between = this.spacesFromEnd(tokens);
        this.raw(node, 'selector', tokens);
        this.current = node;
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
        } else {
            const match = text.match(/^(\s*)([^]*[^\s])(\s*)$/);

            node.text = match[2];

            // Add extra spaces to generate a comment in a common style /*[space][text][space]*/
            node.raws.left = match[1] || ' ';
            node.raws.right = match[3] || ' ';
        }
    }

    /**
     * @description Create a Rule node
     * @param options {{start: number, params: Array}}
     */
    createRule (options) {
        this.rule(this.tokens.slice(options.start, this.pos + 1));

        /**
         * By default in PostCSS `Rule.params` is `undefined`. There are rules to save the compability with PostCSS:
         *  - Don't set empty params for Rule node.
         *  - Set params fro Rule node only if it can be a mixin or &:extend rule.
         */
        if (options.params[0] && (options.mixin || options.isExtendRule)) {
            this.raw(this.current, 'params', options.params);
        }

        if (options.mixin) {
            this.current.mixin = true;
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
     * @description Create a Rule block and close it, because this mixin doesn't have a body
     * @param options
     */
    ruleWithoutBody (options) {
        this.createRule(options);

        /**
         * @description Mark mixin without body.
         * @type {boolean}
         */
        this.current.ruleWithoutBody = true;

        // remove `nodes` property from rules without body
        // eslint-disable-next-line
        delete this.current.nodes;

        if (options.isExtendRule) {
            this.current.extend = true;
        }

        if (this.current.selector.indexOf('!important') >= 0) {
            this.current.important = true;
        }

        this.pos--;

        this.end(this.tokens[this.pos]);
    }

    /**
     * @description
     * @param options
     * @returns {boolean}
     */
    processEndOfRule (options) {
        const {start} = options;

        if (options.isExtendRule || options.mixin) {
            this.ruleWithoutBody(options);
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

            this.createDeclaration({start});
            return true;
        }

        return false;
    }

    /* eslint-disable max-statements, complexity */
    other () {
        let end = false;
        let colon = false;
        let bracket = null;
        const brackets = [];
        const start = this.pos;

        // we need pass "()" as spaces
        // However we can override method Parser.loop, but it seems less maintainable
        if (this.tokens[start][0] === 'brackets') {
            this.spaces += this.tokens[start][1];
            return;
        }
        const mixin = isMixinToken(this.tokens[start]);
        const isExtendRule = Boolean(findExtendRule(this.tokens, start));
        const params = [];

        this.pos += 1;
        while (this.pos < this.tokens.length) {
            const token = this.tokens[this.pos];
            const type = token[0];

            if (type === '(' || type === '[') {
                if (!bracket) {
                    bracket = token;
                }

                brackets.push(type === '(' ? ')' : ']');
            } else if (brackets.length === 0) {
                if (type === ';') {
                    const foundEndOfRule = this.processEndOfRule({
                        start,
                        params,
                        colon,
                        mixin,
                        isExtendRule
                    });

                    if (foundEndOfRule) {
                        return;
                    }

                    break;
                } else if (type === '{') {
                    this.createRule({start, params, mixin});
                    return;
                } else if (type === '}') {
                    this.pos -= 1;
                    end = true;
                    break;
                } else if (type === ':') {
                    colon = true;
                }
            } else if (type === brackets[brackets.length - 1]) {
                brackets.pop();
                if (brackets.length === 0) {
                    bracket = null;
                }
            }

            // we don't want to add params for pseudo-selectors that utilize parens (#56)
            if ((isExtendRule || !colon) && (brackets.length > 0 || type === 'brackets' || params[0])) {
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
            const foundEndOfRule = this.processEndOfRule({
                start,
                params,
                colon,
                mixin,
                isExtendRule,
                isEndOfBlock: true
            });

            if (foundEndOfRule) {
                return;
            }
        }

        this.unknownWord(start);
    }

    /* eslint-enable max-statements, complexity */
}
