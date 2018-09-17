const PostCssRoot = require('postcss/lib/root');
const stringify = require('./less-stringify');

module.exports = class Root extends PostCssRoot {
  toString (stringifier) {
    if (!stringifier) {
      stringifier = {
        stringify
      };
    }

    return super.toString(stringifier);
  }
};
