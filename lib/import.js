const PostCssRule = require('postcss/lib/rule');
const stringify = require('./less-stringify');

module.exports = class Import extends PostCssRule {
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
};
