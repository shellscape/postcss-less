import Input from 'postcss/lib/input';
// import Parser from 'postcss/lib/parser';

import LessParser from './less-parser';

export default function lessParse (less, opts) {
  const input = new Input(less, opts);
  const parser = new LessParser(input, opts);
  // const parser = new Parser(input, opts);

  parser.tokenize();
  parser.loop();

  return parser.root;
}
