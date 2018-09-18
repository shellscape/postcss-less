const Stringifier = require('postcss/lib/stringifier');

module.exports = class LessStringifier extends Stringifier {
  atrule(node, semicolon) {
    if (!node.mixin) {
      super.atrule(node, semicolon);
      return;
    }

    let name = `.${node.name}`;
    const important = node.raws.important || '';
    const params = node.params ? this.rawValue(node, 'params') : '';

    if (typeof node.raws.afterName !== 'undefined') {
      name += node.raws.afterName;
    } else if (params) {
      name += ' ';
    }

    if (node.nodes) {
      this.block(node, name + params + important);
    } else {
      const end = (node.raws.between || '') + important + (semicolon ? ';' : '');
      this.builder(name + params + end, node);
    }
  }

  comment(node) {
    if (node.inline) {
      const left = this.raw(node, 'left', 'commentLeft');
      const right = this.raw(node, 'right', 'commentRight');
      this.builder(`//${left}${node.text}${right}`, node);
    } else {
      super.comment(node);
    }
  }
};
