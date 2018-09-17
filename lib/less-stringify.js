const LessStringifier = require('./less-stringifier');

module.exports = (node, builder) => {
  const str = new LessStringifier(builder);

  str.stringify(node);
};
