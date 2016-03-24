import AtRule from 'postcss/lib/at-rule';
import Comment from 'postcss/lib/comment';
import Parser from 'postcss/lib/parser';

import isMixinName from './tokenizer/is-mixin-name';
import lessTokenizer from './less-tokenize';

const mixinRuleToken = 'mixinRule';
const mixinParamToken = 'mixin-param';
const atRuleToken = 'atrule';
const defaultOptions = {
    mixinsAsAtRules: false,
    innerMixinsAsRules: false
};

export default class LessParser extends Parser {
    constructor (input, opts) {
        super(input);

        Object.assign(this, defaultOptions, opts);
    }

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

    rule (tokens) {
        super.rule(tokens);
        
        const {selector} = this.current;

        /**
         * We should separate rules and mixins. According to LESS spec (http://lesscss.org/features/#mixins-feature)
         * mixins can have the same syntax as inner blocks, so we will handle only mixins as functions,
         * that contain symbol '('.
         */
        if (isMixinName(selector) && selector.indexOf('(') > 0) {
            // this.current is the 'rule' node created in super.rule()
            this.current.name = tokens[0][1].slice(1);

            // parse inner mixin rule nodes as base rule node
            if (this.innerMixinsAsRules && this.current.parent.type !== 'root') {
                return;
            }

            if (this.mixinsAsAtRules === true) {
                this.current.type = atRuleToken;
                this.current.lessType = mixinRuleToken;
            } else {
                this.current.type = mixinRuleToken;
            }

            this.current.definition = true;
            this.current.params = [];

            let blockStart = tokens.findIndex((x) => x[0] === '(');
            const blockEnd = tokens.findIndex((x) => x[0] === ')');

            tokens.forEach((token) => {
                if (token[0] !== mixinParamToken) {
                    return;
                }

                const index = tokens.indexOf(token);
                const param = new AtRule();
                let pos = blockStart;
                const prev = this.current.params[this.current.params.length - 1];
                let termToken = null;

                param.name = token[1].slice(1);
                param.type = mixinParamToken;
                param.source = {
                    start: {line: token[2], column: token[3]},
                    input: this.input
                };
                param.raws = {before: '', after: '', between: ''};

                if (token[6] && token[6] === 'rest-variables') {
                    param.restVariables = true;
                }

                while (pos < blockEnd) {
                    termToken = tokens[pos];

                    if (termToken[0] === ';') {
                        param.source.end = {line: termToken[2], column: termToken[3]};
                        param.raws.semicolon = true;
                        blockStart = pos + 1;
                        break;
                    } else if (termToken[0] === 'space') {
                        param.raws.before += termToken[1];

                        if (prev) {
                            prev.raws.after += termToken[1];
                        }
                    }

                    pos += 1;
                }

                // this is the last param in the block
                if (pos === blockEnd) {
                    pos = index;
                    while (pos < blockEnd) {
                        termToken = tokens[pos];

                        if (termToken[0] === 'space') {
                            param.raws.after += termToken[1];
                        }

                        pos += 1;
                    }

                    param.source.end = {line: token[4], column: token[5]};
                }

                this.current.params.push(param);
            });
        }
    }
}
