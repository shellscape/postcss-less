const LessStringifier = require('./less-stringifier');

module.exports = function lessStringify (node, builder) {
  const str = new LessStringifier(builder);

  str.stringify(node);
};
