import Comment from 'postcss/lib/comment';
import Parser from 'postcss/lib/parser';
import isMixinName from './is-mixin-name';
import lessTokenizer from './less-tokenize';

export default class LessParser extends Parser {
    tokenize () {
        this.tokens = lessTokenizer(this.input);
    }

    comment (token) {
        if (token[6] === 'inline') {
            const node = new Comment();

            this.init(node, token[2], token[3]);
            node.raws.inline = true;
            node.source.end = {line: token[4], column: token[5]};

            const text = token[1].slice(2);

            if (/^\s*$/.test(text)) {
                node.text = '';
                node.raws.left = text;
                node.raws.right = '';
            } else {
                const match = text.match(/^(\s*)([^]*[^\s])(\s*)$/);

                node.text = match[2];
                node.raws.left = match[1];
                node.raws.right = match[3];
            }
        } else {
            super.comment(token);
        }
    }

    /**
     * @description Create a Rule node
     * @param options {{start: number, params: Array}}
     */
    createRule (options) {
        this.rule(this.tokens.slice(options.start, this.pos + 1));
        this.raw(this.current, 'params', options.params);
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
    mixinWithoutBody (options) {
        this.createRule(options);

        /**
         * @description Mark this node
         * @type {boolean}
         */
        this.current.mixinWithoutBody = true;
        this.current.important = this.current.selector.indexOf('!important') >= 0;
        this.end(this.tokens[this.pos]);
    }

    /* eslint-disable max-statements, complexity */
    word () {
        let token = this.tokens[this.pos];
        let end = false;
        let colon = false;
        let bracket = null;
        let brackets = 0;
        const start = this.pos;
        const isMixin = isMixinName(token[1]);
        const params = [];
        
        this.pos += 1;

        while (this.pos < this.tokens.length) {
            token = this.tokens[this.pos];
            const type = token[0];

            if (type === '(') {
                if (!bracket) {
                    bracket = token;
                }

                brackets += 1;
            } else if (brackets === 0) {
                if (type === ';') {
                    if (colon) {
                        this.createDeclaration({start});
                        return;
                    }
                    
                    if (isMixin) {
                        this.mixinWithoutBody({start, params});
                        return;
                    }

                    break;
                } else if (type === '{') {
                    this.createRule({start, params});
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
            if (colon) {
                while (this.pos > start) {
                    token = this.tokens[this.pos][0];
                    if (token !== 'space' && token !== 'comment') {
                        break;
                    }

                    this.pos -= 1;
                }

                this.createDeclaration({start});
                return;
            } else if (isMixin) {
                this.mixinWithoutBody({start, params});
                return;
            }
        }

        this.unknownWord(start);
    }
    /* eslint-enable max-statements, complexity */
}
