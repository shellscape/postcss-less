const Input = require('postcss/lib/input');
const LessParser = require('./LessParser');

module.exports = function lessParse (less, opts) {
  const input = new Input(less, opts);
  const parser = new LessParser(input, opts);
  // const parser = new Parser(input, opts);

  parser.tokenize();
  parser.loop();

  return parser.root;
};
