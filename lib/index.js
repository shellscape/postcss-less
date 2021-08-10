/* eslint-disable import/no-extraneous-dependencies */

const Input = require('postcss/lib/input');

const LessParser = require('./LessParser');
const LessStringifier = require('./LessStringifier');

module.exports = {
  parse(less, options) {
    const input = new Input(less, options);
    const parser = new LessParser(input);

    parser.parse();

    parser.root.walk((node, index) => {
      // TODO: post-process here
      console.log('=========');
      const offset = input.css.lastIndexOf(node.source.input.css);
      console.log('computed offset:', offset);
      console.log('input.css:', input.css);
      console.log('node.source.input.css:', node.source.input.css);
      console.log('original source:', node.source);

      // Sanity check
      if (offset + node.source.input.css.length !== input.css.length) {
        console.log('input.css:', input.css);
        console.log('node.source.input.css:', node.source.input.css);
        throw new Error('TODO handle me');
      }

      const newStartOffset = offset + node.source.start.offset;
      const newEndOffset = offset + node.source.end.offset;
      const newStartPosition = input.fromOffset(offset + node.source.start.offset);
      const newEndPosition = input.fromOffset(offset + node.source.end.offset);

      // eslint-disable-next-line no-param-reassign
      node.source.start = {
        offset: newStartOffset,
        line: newStartPosition.line,
        column: newStartPosition.col
      };

      // eslint-disable-next-line no-param-reassign
      node.source.end = {
        offset: newEndOffset,
        line: newEndPosition.line,
        column: newEndPosition.col
      }

      console.log(node.source.start);
      node.source.end = input.fromOffset(offset + node.source.end.offset);
      console.log(node.source.end);
    });

    return parser.root;
  },

  stringify(node, builder) {
    const stringifier = new LessStringifier(builder);
    stringifier.stringify(node);
  },

  nodeToString(node) {
    let result = '';

    module.exports.stringify(node, (bit) => {
      result += bit;
    });

    return result;
  }
};
