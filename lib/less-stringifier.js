import Stringifier from 'postcss/lib/stringifier';

export default class LessStringifier extends Stringifier {
    comment (node) {
        const left = this.raw(node, 'left', 'commentLeft');
        const right = this.raw(node, 'right', 'commentRight');

        if (node.raws.inline) {
            this.builder(`//${ left }${ node.text }${ right }`, node);
        } else {
            this.builder(`/*${ left }${ node.text }${ right }*/`, node);
        }
    }

    atrule (node, semicolon) {
        const {lessType} = node;

        if (lessType) {
            if (this[lessType]) {
                this[lessType](node, semicolon);
            }
        } else {
            super.atrule(node, semicolon);
        }
    }

    mixinRule (node) {
        this.builder(node.source.input.css);
    }
}
