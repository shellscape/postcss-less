const singleQuote = '\''.charCodeAt(0);
const doubleQuote = '"'.charCodeAt(0);
const backslash = '\\'.charCodeAt(0);
const slash = '/'.charCodeAt(0);
const newline = '\n'.charCodeAt(0);
const space = ' '.charCodeAt(0);
const feed = '\f'.charCodeAt(0);
const tab = '\t'.charCodeAt(0);
const carriageReturn = '\r'.charCodeAt(0);
const openedParentheses = '('.charCodeAt(0);
const closedParentheses = ')'.charCodeAt(0);
const openedСurlyBracket = '{'.charCodeAt(0);
const closedCurlyBracket = '}'.charCodeAt(0);
const semicolon = ';'.charCodeAt(0);
const asterisk = '*'.charCodeAt(0);
const colon = ':'.charCodeAt(0);
const comma = ','.charCodeAt(0);
const atRule = '@'.charCodeAt(0);
const atEndPattern = /[ \n\t\r\f\{\(\)'"\\;/]/g;
const wordEndPattern = /[ \n\t\r\f\(\)\{\}:;@!'"\\#]|\/(?=\*)/g;
const badBracketPattern = /.[\\\/\("'\n]/;
const variablePattern = /^@[^:\(\{]+:/;

export default function lessTokenize (input) {
    const tokens = [];
    const css = input.css.valueOf();
    const {length} = css;
    let offset = -1;
    let line = 1;
    let pos = 0;

    function unclosed (what) {
        throw input.error(`Unclosed ${what}`, line, pos - offset);
    }

    while (pos < length) {
        let symbolCode = css.charCodeAt(pos);
        let symbol = css[pos];
        let nextSymbolCode;
        let nextPos;
        let escaped;
        let lines;
        let lastLine;
        let cssPart;
        let escape;
        let nextLine;
        let nextOffset;
        let escapePos;
        let token;

        if (symbolCode === newline) {
            offset = pos;
            line += 1;
        }

        switch (symbolCode) {
            case newline:
            case space:
            case tab:
            case carriageReturn:
            case feed:
            {
                nextPos = pos;

                //collect all neighbour space symbols
                do {
                    nextPos += 1;
                    symbolCode = css.charCodeAt(nextPos);

                    if (symbolCode === newline) {
                        offset = nextPos;
                        line += 1;
                    }
                } while (
                    symbolCode === space ||
                    symbolCode === newline ||
                    symbolCode === tab ||
                    symbolCode === carriageReturn ||
                    symbolCode === feed
                );

                tokens.push(['space', css.slice(pos, nextPos)]);
                pos = nextPos - 1;
                break;
            }

            case comma:
            {
                tokens.push(['word', symbol,
                    line, pos - offset,
                    line, pos - offset + 1
                ]);

                break;
            }

            case colon:
            case semicolon:
            case openedСurlyBracket:
            case closedCurlyBracket:
            case closedParentheses:
            {
                tokens.push([symbol, symbol,
                    line, pos - offset
                ]);

                break;
            }

            case openedParentheses:
            {
                nextSymbolCode = css.charCodeAt(pos + 1);
                const tokensCount = tokens.length;
                const prevTokenCssPart = tokensCount ? tokens[tokensCount - 1][1] : '';

                if (
                    prevTokenCssPart === 'url' &&
                    nextSymbolCode !== singleQuote &&
                    nextSymbolCode !== doubleQuote &&
                    nextSymbolCode !== space &&
                    nextSymbolCode !== newline &&
                    nextSymbolCode !== tab &&
                    nextSymbolCode !== feed &&
                    nextSymbolCode !== carriageReturn
                ) {
                    nextPos = pos;

                    do {
                        escaped = false;
                        nextPos = css.indexOf(')', nextPos + 1);
                        if (nextPos === -1) {
                            unclosed('bracket');
                        }

                        escapePos = nextPos;
                        while (css.charCodeAt(escapePos - 1) === backslash) {
                            escapePos -= 1;
                            escaped = !escaped;
                        }
                    } while (escaped);

                    tokens.push(['brackets', css.slice(pos, nextPos + 1),
                        line, pos - offset,
                        line, nextPos - offset
                    ]);

                    pos = nextPos;
                } else {
                    nextPos = css.indexOf(')', pos + 1);
                    cssPart = css.slice(pos, nextPos + 1);

                    if (nextPos === -1 || badBracketPattern.test(cssPart)) {
                        tokens.push(['(', '(',
                            line, pos - offset
                        ]);
                    } else {
                        tokens.push(['brackets', cssPart,
                            line, pos - offset,
                            line, nextPos - offset
                        ]);

                        pos = nextPos;
                    }
                }

                break;
            }

            case singleQuote:
            case doubleQuote:
            {
                nextPos = pos;
                do {
                    escaped = false;
                    nextPos = css.indexOf(symbol, nextPos + 1);
                    if (nextPos === -1) {
                        unclosed('quote');
                    }

                    escapePos = nextPos;
                    while (css.charCodeAt(escapePos - 1) === backslash) {
                        escapePos -= 1;
                        escaped = !escaped;
                    }

                } while (escaped);

                tokens.push(['string', css.slice(pos, nextPos + 1),
                    line, pos - offset,
                    line, nextPos - offset
                ]);

                pos = nextPos;
                break;
            }

            case atRule:
            {
                // interpolation: @{...
                if (css.charCodeAt(pos + 1) === openedСurlyBracket) {
                    nextPos = css.indexOf('}', pos + 2);
                    if (nextPos === -1) {
                        unclosed('interpolation');
                    }

                    cssPart = css.slice(pos, nextPos + 1);
                    lines = cssPart.split('\n');
                    lastLine = lines.length - 1;

                    if (lastLine > 0) {
                        nextLine = line + lastLine;
                        nextOffset = nextPos - lines[lastLine].length;
                    } else {
                        nextLine = line;
                        nextOffset = offset;
                    }

                    tokens.push(['word', cssPart,
                        line, pos - offset,
                        nextLine, nextPos - nextOffset
                    ]);

                    offset = nextOffset;
                    line = nextLine;
                } else {
                    atEndPattern.lastIndex = pos + 1;
                    atEndPattern.test(css);
                    if (atEndPattern.lastIndex === 0) {
                        nextPos = css.length - 1;
                    } else {
                        nextPos = atEndPattern.lastIndex - 2;
                    }

                    cssPart = css.slice(pos, nextPos + 1);
                    token = 'at-word';

                    //check if it's a variable
                    if (variablePattern.test(cssPart)) {
                        wordEndPattern.lastIndex = pos + 1;
                        wordEndPattern.test(css);
                        if (wordEndPattern.lastIndex === 0) {
                            nextPos = css.length - 1;
                        } else {
                            nextPos = wordEndPattern.lastIndex - 2;
                        }

                        cssPart = css.slice(pos, nextPos + 1);
                        token = 'word';
                    }

                    tokens.push([token, cssPart,
                        line, pos - offset,
                        line, nextPos - offset
                    ]);
                }

                pos = nextPos;
                break;
            }

            case backslash:
            {
                nextPos = pos;
                escape = true;

                while (css.charCodeAt(nextPos + 1) === backslash) {
                    nextPos += 1;
                    escape = !escape;
                }

                symbolCode = css.charCodeAt(nextPos + 1);
                if (
                    escape && (
                        symbolCode !== slash &&
                        symbolCode !== space &&
                        symbolCode !== nextLine &&
                        symbolCode !== tab &&
                        symbolCode !== carriageReturn &&
                        symbolCode !== feed
                    )
                ) {
                    nextPos += 1;
                }

                tokens.push(['word', css.slice(pos, nextPos + 1),
                    line, pos - offset,
                    line, nextPos - offset
                ]);

                pos = nextPos;
                break;
            }

            default:
            {
                nextSymbolCode = css.charCodeAt(pos + 1);

                if (symbolCode === slash && nextSymbolCode === asterisk) {
                    nextPos = css.indexOf('*/', pos + 2) + 1;
                    if (nextPos === 0) {
                        unclosed('comment');
                    }

                    cssPart = css.slice(pos, nextPos + 1);
                    lines = cssPart.split('\n');
                    lastLine = lines.length - 1;

                    if (lastLine > 0) {
                        nextLine = line + lastLine;
                        nextOffset = nextPos - lines[lastLine].length;
                    } else {
                        nextLine = line;
                        nextOffset = offset;
                    }

                    tokens.push(['comment', cssPart,
                        line, pos - offset,
                        nextLine, nextPos - nextOffset
                    ]);

                    offset = nextOffset;
                    line = nextLine;
                    pos = nextPos;
                } else if (symbolCode === slash && nextSymbolCode === slash) {
                    nextPos = css.indexOf('\n', pos + 2) - 1;
                    if (nextPos === -2) {
                        nextPos = css.length - 1;
                    }

                    tokens.push(['comment', css.slice(pos, nextPos + 1),
                        line, pos - offset,
                        line, nextPos - offset,
                        'inline'
                    ]);

                    pos = nextPos;
                } else {
                    wordEndPattern.lastIndex = pos + 1;
                    wordEndPattern.test(css);

                    if (wordEndPattern.lastIndex === 0) {
                        nextPos = css.length - 1;
                    } else {
                        nextPos = wordEndPattern.lastIndex - 2;
                    }

                    tokens.push(['word', css.slice(pos, nextPos + 1),
                        line, pos - offset,
                        line, nextPos - offset
                    ]);

                    pos = nextPos;
                }

                break;
            }
        }

        pos++;
    }


    console.log(tokens);

    return tokens;
}
