const { stringify } = require('./stringify');

const nodeToString = (node) => {
  let result = '';

  stringify(node, (bit) => {
    result += bit;
  });

  return result;
};

module.exports = { nodeToString };
