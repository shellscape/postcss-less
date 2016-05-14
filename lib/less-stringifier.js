import Stringifier from 'postcss/lib/stringifier';

export default class LessStringifier extends Stringifier {
    comment (node) {
        const left = this.raw(node, 'left', 'commentLeft');
        const right = this.raw(node, 'right', 'commentRight');

        if (node.inline) {
            this.builder(`//${ left }${ node.text }${ right }`, node);
        } else {
            this.builder(`/*${ left }${ node.text }${ right }*/`, node);
        }
    }

    block (node, start) {
        const {ruleWithoutBody} = node;
        const between = this.raw(node, 'between', 'beforeOpen');
        let after = '';
        
        if (ruleWithoutBody) {
            this.builder(start + between, node, 'start');
        } else {
            this.builder(`${ start + between }{`, node, 'start');
        }
        
        if (node.nodes && node.nodes.length) {
            this.body(node);
            after = this.raw(node, 'after');
        } else {
            after = this.raw(node, 'after', 'emptyBody');
        }

        if (after) {
            this.builder(after);
        }
        
        if (!ruleWithoutBody) {
            this.builder('}', node, 'end');
        }
    }
}