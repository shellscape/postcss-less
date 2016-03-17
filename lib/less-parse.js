import Input from 'postcss/lib/input';

import LessParser from './less-parser';

export default function lessParse (less, opts) {
    const input = new Input(less, opts);
    const parser = new LessParser(input, opts);

    parser.tokenize();
    parser.loop();

    return parser.root;
}
