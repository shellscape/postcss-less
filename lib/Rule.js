const PostCssRule = require('postcss/lib/rule');
const stringify = require('./less-stringify');

module.exports = class Rule extends PostCssRule {
  toString (stringifier) {
    if (!stringifier) {
      stringifier = {
        stringify
      };
    }

    return super.toString(stringifier);
  }
};
