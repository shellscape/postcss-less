const LessStringifier = require('../LessStringifier');

const stringify = (node, builder) => {
  const stringifier = new LessStringifier(builder);
  stringifier.stringify(node);
};

module.exports = { stringify };
