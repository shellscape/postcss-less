const Input = require('postcss/lib/input');
const Stringifier = require('postcss/lib/stringifier');

const LessParser = require('./LessParser');

module.exports = {
  parse(less, options) {
    const input = new Input(less, options);
    const parser = new LessParser(input);

    parser.parse();

    return parser.root;
  },

  stringify(node, builder) {
    const stringifier = new Stringifier(builder);
    stringifier.stringify(node);
  }
};
