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
    
    mixin (node) {
        this.builder(node.source.input.css);
    }
}
