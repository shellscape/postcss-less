import AtRule from 'postcss/lib/at-rule';
import Comment from 'postcss/lib/comment';
import Parser from 'postcss/lib/parser';

import lessTokenizer from './less-tokenize';

const MixinDefinitionPattern = /^([#.](?:[\w-]|\\(?:[A-Fa-f0-9]{1,6} ?|[^A-Fa-f0-9]))+)\s*\(/;

export default class LessParser extends Parser {
    constructor (input, opts) {
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

    rule (token) {
        super.rule(token);

        if (MixinDefinitionPattern.test(this.current.source.input.css)) {
            // this.current is the 'rule' node created in super.rule()
            this.current.name = token[0][1].slice(1);
            this.current.type = 'mixin';
            this.current.definition = true;
            this.current.params = [];

            let blockStart = token.findIndex((x) => x[0] === '(');
            const blockEnd = token.findIndex((x) => x[0] === ')');

            token.forEach((tokn) => {
                if (tokn[0] !== 'mixin-param') {
                    return;
                }

                const index = token.indexOf(tokn);
                const param = new AtRule();
                let pos = blockStart;
                const prev = this.current.params[this.current.params.length - 1];
                let termToken = null;

                param.name = tokn[1].slice(1);
                param.type = 'mixin-param';
                param.source = {
                    start: {line: tokn[2], column: tokn[3]},
                    input: this.input
                };
                param.raws = {before: '', after: '', between: ''};

                if (tokn[6] && tokn[6] === 'var-dict') {
                    param.variableDict = true;
                }

                while (pos < blockEnd) {
                    termToken = token[pos];

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
                        termToken = token[pos];

                        if (termToken[0] === 'space') {
                            param.raws.after += termToken[1];
                        }

                        pos += 1;
                    }

                    param.source.end = {line: tokn[4], column: tokn[5]};
                }

                this.current.params.push(param);
            });
        }
    }
}
