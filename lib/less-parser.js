import Comment from 'postcss/lib/comment';
import Parser from 'postcss/lib/parser';
import findExtendRule from './find-extend-rule';
import isMixinToken from './is-mixin-token';
import lessTokenizer from './less-tokenize';

const blockCommentEndPattern = /\*\/$/;

export default class LessParser extends Parser {
    tokenize () {
        this.tokens = lessTokenizer(this.input);
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
        if (options.params[0] && (options.isMixin || options.isExtendRule)) {
            this.raw(this.current, 'params', options.params);
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
        this.current.extendRule = this.current.selector.indexOf('&:extend') >= 0;
        this.current.important = this.current.selector.indexOf('!important') >= 0;
        this.end(this.tokens[this.pos]);
    }

    /**
     * @description
     * @param options
     * @returns {boolean}
     */
    processEndOfRule (options) {
        const {start} = options;

        if (options.isExtendRule || options.isMixin) {
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
    word () {
        let end = false;
        let colon = false;
        let bracket = null;
        let brackets = 0;
        const start = this.pos;
        const isMixin = isMixinToken(this.tokens[start]);
        const isExtendRule = Boolean(findExtendRule(this.tokens, start));
        const params = [];

        this.pos += 1;

        while (this.pos < this.tokens.length) {
            const token = this.tokens[this.pos];
            const type = token[0];

            if (type === '(') {
                if (!bracket) {
                    bracket = token;
                }

                brackets += 1;
            } else if (brackets === 0) {
                if (type === ';') {

                    const foundEndOfRule = this.processEndOfRule({
                        start,
                        params,
                        colon,
                        isMixin,
                        isExtendRule
                    });

                    if (foundEndOfRule) {
                        return;
                    }

                    break;
                } else if (type === '{') {
                    this.createRule({start, params, isMixin});
                    return;
                } else if (type === '}') {
                    this.pos -= 1;
                    end = true;
                    break;
                } else if (type === ':') {
                    colon = true;
                }
            } else if (type === ')') {
                brackets -= 1;
                if (brackets === 0) {
                    bracket = null;
                }
            }

            if (brackets || type === 'brackets' || params[0]) {
                params.push(token);
            }

            this.pos += 1;
        }

        if (this.pos === this.tokens.length) {
            this.pos -= 1;
            end = true;
        }

        if (brackets > 0) {
            this.unclosedBracket(bracket);
        }

        if (end) {
            const foundEndOfRule = this.processEndOfRule({
                start,
                params,
                colon,
                isMixin,
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
