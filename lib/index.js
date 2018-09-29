const Input = require('postcss/lib/input');

const LessParser = require('./LessParser');

const { nodeToString } = require('./nodes/nodeToString');
const { stringify } = require('./nodes/stringify');

module.exports = {
  parse(less, options) {
    const input = new Input(less, options);
    const parser = new LessParser(input);

    parser.parse();

    return parser.root;
  },

  stringify,

  nodeToString
};
