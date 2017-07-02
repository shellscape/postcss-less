import PostCssRoot from 'postcss/lib/root';
import stringify from './less-stringify';

export default class Root extends PostCssRoot {
  toString (stringifier) {
    if (!stringifier) {
      stringifier = {
        stringify
      };
    }

    return super.toString(stringifier);
  }
}
