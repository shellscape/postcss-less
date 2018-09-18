const LessStringifier = require('./LessStringifier');

module.exports = function lessStringify (node, builder) {
  const str = new LessStringifier(builder);

  str.stringify(node);
};
