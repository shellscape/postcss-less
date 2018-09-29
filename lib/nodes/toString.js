/* eslint no-param-reassign: off */

const { nodeToString } = require('./nodeToString');

module.exports = (node) => {
  node.toString = () => nodeToString(node);
};
