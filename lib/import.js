import PostCssRule from 'postcss/lib/rule';
import stringify from './less-stringify';

export default class Import extends PostCssRule {
    constructor (defaults) {
        super(defaults);
        this.type = 'import';
    }

    toString (stringifier) {
        if (!stringifier) {
            stringifier = {
                stringify
            };
        }

        return super.toString(stringifier);
    }
}
