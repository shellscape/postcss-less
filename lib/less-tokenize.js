import 'es6-shim';

const singleQuote = '\''.charCodeAt(0);
const doubleQuote = '"'.charCodeAt(0);
const backslash = '\\'.charCodeAt(0);
const slash = '/'.charCodeAt(0);
const newline = '\n'.charCodeAt(0);
const space = ' '.charCodeAt(0);
const feed = '\f'.charCodeAt(0);
const tab = '\t'.charCodeAt(0);
const carriageReturn = '\r'.charCodeAt(0);
const openedParenthesis = '('.charCodeAt(0);
const closedParenthesis = ')'.charCodeAt(0);
const openedCurlyBracket = '{'.charCodeAt(0);
const closedCurlyBracket = '}'.charCodeAt(0);
const semicolon = ';'.charCodeAt(0);
const asterisk = '*'.charCodeAt(0);
const ampersand = '&'.charCodeAt(0);
const colon = ':'.charCodeAt(0);
const comma = ','.charCodeAt(0);
const dot = '.'.charCodeAt(0);
const atRule = '@'.charCodeAt(0);
const tilde = '~'.charCodeAt(0);
const hash = '#'.charCodeAt(0);
const atEndPattern = /[ \n\t\r\f\{\(\)'"`\\;/]/g;
const wordEndPattern = /[ \n\t\r\f\(\)\{\}:,;@!'"`\\#]|\/(?=\*)/g;
const badBracketPattern = /.[\\\/\("'\n]/;
const variablePattern = /^@[^:\(\{]+:/;
const hashColorPattern = /^#[0-9a-fA-F]{6}$|^#[0-9a-fA-F]{3}$/;
const nestedExtendWord = '&:extend';
const nestedExtendWordLength = nestedExtendWord.length;

function isMixinName (str) {
  const firstSymbolCode = str ? str[0].charCodeAt(0) : null;

  return (firstSymbolCode === dot || firstSymbolCode === hash) &&
    hashColorPattern.test(str) === false && // ignore hashes used for colors
    /\.[0-9]/.test(str) === false;          // ignore dots used for unpadded fractional numbers
}

function findEndOfExpression (css, length, j) {
  let openedParenthesisBlocks = 0;
  let openedCurlyBlocks = 0;

  for (; j < length; ++j) {
    const symbolCode = css[j].charCodeAt(0);

    // find the on of escaped expression
    if (
      !openedParenthesisBlocks && !openedCurlyBlocks &&
      (symbolCode === semicolon || symbolCode === closedCurlyBracket)
    ) {
      return j - 1;
    }

    switch (symbolCode) {
      case openedCurlyBracket:
        openedCurlyBlocks++;
        break;

      case closedCurlyBracket:
        openedCurlyBlocks--;
        break;

      case openedParenthesis:
        openedParenthesisBlocks++;
        break;

      case closedParenthesis:
        openedParenthesisBlocks--;
        break;
    }
  }

  return -1;
}

export default function lessTokenize (input) {
  const tokens = [];
  const css = input.css.valueOf();

  const { length } = css;
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

          // collect all neighbour space symbols
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
            symbolCode === feed);

          tokens.push(['space', css.slice(pos, nextPos)]);
          pos = nextPos - 1;
          break;
        }

      case comma:
        {
          tokens.push([
            'word', symbol,
            line, pos - offset,
            line, pos - offset + 1
          ]);
          break;
        }

      case colon:
      case semicolon:
      case openedCurlyBracket:
      case closedCurlyBracket:
      case closedParenthesis:
        {
          tokens.push([
            symbol, symbol,
            line, pos - offset
          ]);
          break;
        }

      case openedParenthesis:
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

            let badBracket = badBracketPattern.test(cssPart);
            let foundParam = cssPart.indexOf('@') >= 0;
            let foundString = /['"]/.test(cssPart);

            if (cssPart.length === 0 || cssPart === '...' || (foundParam && !foundString)) {
              // we're dealing with a mixin param block
              if (nextPos === -1 || badBracket) {
                unclosed('bracket');
              }

              tokens.push([
                symbol, symbol,
                line, pos - offset
              ]);
            } else if (nextPos === -1 || badBracket) {
              tokens.push([
                symbol, symbol,
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
          // n = css.charCodeAt(pos + 1);

          if (css.charCodeAt(pos + 1) === openedCurlyBracket) {
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

            // check if it's a variable
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
            } else {
              let nParenStart = tokens.findIndex((t) => t[0] === '(');
              let nParenEnd = tokens.findIndex((t) => t[0] === ')');

              if (nParenStart >= 0 && nParenEnd < 0) {
                token = 'mixin-param';
              }
            }

            tokens.push([
              token, cssPart,
              line, pos - offset,
              line, nextPos - offset
            ]);

            if (token === 'mixin-param') {
              let varDictPos = cssPart.indexOf('...');

              if (varDictPos >= 0 && varDictPos + 3 === cssPart.length) {
                tokens[tokens.length - 1].push('var-dict');
              }
            }
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
              symbolCode !== newline &&
              symbolCode !== tab &&
              symbolCode !== carriageReturn &&
              symbolCode !== feed)
            ) {
            nextPos += 1;
          }

          tokens.push([
            'word', css.slice(pos, nextPos + 1),
            line, pos - offset,
            line, nextPos - offset
          ]);

          pos = nextPos;
          break;
        }

      default:
        {
          // it's a nested &:extend
          if (symbolCode === ampersand && css.slice(pos, pos + nestedExtendWordLength) === nestedExtendWord) {
            const end = findEndOfExpression(css, length, pos + nestedExtendWordLength);

            if (end !== -1) {
              tokens.push(['nested-extend', css.slice(pos, end + 1),
                line, pos - offset,
                nextLine, end - nextOffset
              ]);

              pos = end;
            }

            break;
          }

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

            tokens.push([
              'comment', cssPart,
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

            tokens.push([
              'comment', css.slice(pos, nextPos + 1),
              line, pos - offset,
              line, nextPos - offset,
              'inline'
            ]);

            pos = nextPos;
          } else {
            let isEscaping = false;

            if (symbolCode === tilde) {
              let quotePattern = /\s*['"`]/g;
              quotePattern.lastIndex = pos + 1;
              let match = quotePattern.exec(css);

              if (match && match.index === pos + 1) {
                var end = findEndOfExpression(css, length, quotePattern.lastIndex + 1);
                if (end !== -1) {
                  isEscaping = true;
                  nextPos = end;
                }
              }
            }

            if (isEscaping === false) {
              wordEndPattern.lastIndex = pos + 1;
              wordEndPattern.test(css);
              if (wordEndPattern.lastIndex === 0) {
                nextPos = css.length - 1;
              } else {
                nextPos = wordEndPattern.lastIndex - 2;
              }
            }

            cssPart = css.slice(pos, nextPos + 1);

            const tokensCount = tokens.push([
              'word', cssPart,
              line, pos - offset,
              line, nextPos - offset
            ]);

            /**
             * - mark nested mixin by custom token 'nested-mixin'
             * - skip variables that start from dot (.5s) or from hash (#f3f3f3)
             */
            if (
              isMixinName(cssPart) &&
              ((tokens[tokensCount - 2] || [])[1] !== ':') &&
              ((tokens[tokensCount - 3] || [])[1] !== ':')
            ) {
              let openedParenthesisBlocks = 0;
              let openedCurlyBlocks = 0;
              let endLine = line;
              let endOffset = offset;

              for (let j = pos + 1; j < length; j++) {
                symbolCode = css.charCodeAt(j);
                endOffset++;

                if (
                  !openedParenthesisBlocks && !openedCurlyBlocks &&
                  (symbolCode === semicolon || symbolCode === closedCurlyBracket)
                ) {
                  nextPos = j;

                  // not including include '{' symbol
                  if (symbolCode === closedCurlyBracket) {
                    nextPos--;
                  }

                  cssPart = css.slice(pos, nextPos + 1);
                  tokens.pop();
                  tokens.push(['nested-mixin', cssPart,
                    line, pos - offset,
                    endLine, nextPos - endOffset
                  ]);

                  break;
                }

                switch (symbolCode) {
                  case newline:
                    {
                      endLine++;
                      endOffset = j;
                      break;
                    }

                  case openedCurlyBracket:
                    {
                      // it's a CSS block -> exit from the loop
                      if (!openedCurlyBlocks && !openedParenthesisBlocks) {
                        j = length;
                      }

                      openedCurlyBlocks++;
                      break;
                    }

                  case closedCurlyBracket:
                    {
                      openedCurlyBlocks--;
                      break;
                    }

                  case openedParenthesis:
                    {
                      openedParenthesisBlocks++;
                      break;
                    }

                  case closedParenthesis:
                    {
                      openedParenthesisBlocks--;
                      break;
                    }
                }
              }
            }

            pos = nextPos;
          }

          break;
        }
    }

    pos++;
  }

  return tokens;
}
