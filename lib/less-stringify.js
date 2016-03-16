import LessStringifier from './less-stringifier';

export default function lessStringify (node, builder) {
    const str = new LessStringifier(builder);

    str.stringify(node);
}
