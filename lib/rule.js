import PostCssRule from 'postcss/lib/rule';
import stringify from './less-stringify';

export default class Rule extends PostCssRule {
    toString (stringifier) {
        if (!stringifier) {
            stringifier = {
                stringify
            };
        }
        
        return super.toString(stringifier);
    }
}