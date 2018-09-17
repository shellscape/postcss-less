const Stringifier = require('postcss/lib/stringifier');

module.exports = class LessStringifier extends Stringifier {
  comment (node) {
    this.builder(node.raws.content, node);
  }

  import (node) {
    this.builder(`@${ node.name }`);
    this.builder((node.raws.afterName || '') +
                 (node.directives || '') +
                 (node.raws.between || '') +
                 (node.urlFunc ? 'url(' : '') +
                 (node.raws.beforeUrl || '') +
                 (node.importPath || '') +
                 (node.raws.afterUrl || '') +
                 (node.urlFunc ? ')' : '') +
                 (node.raws.after || ''));

    if (node.raws.semicolon) {
      this.builder(';');
    }
  }

  rule (node) {
    super.rule(node);

    if (node.empty && node.raws.semicolon) {
      if (node.important) {
        if (node.raws.important) {
          this.builder(node.raws.important);
        }
        else {
          this.builder(' !important');
        }
      }

      if (node.raws.semicolon) {
        this.builder(';');
      }
    }
  }

  block (node, start) {
    const { empty } = node;
    const between = this.raw(node, 'between', 'beforeOpen');
    let after = '';

    if (empty) {
      this.builder(start + between, node, 'start');
    }
    else {
      this.builder(`${ start + between }{`, node, 'start');
    }

    if (node.nodes && node.nodes.length) {
      this.body(node);
      after = this.raw(node, 'after');
    }
    else {
      after = this.raw(node, 'after', 'emptyBody');
    }

    if (after) {
      this.builder(after);
    }

    if (!empty) {
      this.builder('}', node, 'end');
    }
  }
};
