import parse from '../lib/less-parse';
import {expect} from 'chai';
import cases from 'postcss-parser-tests';

describe('#parse()', () => {
    cases.each((name, css, json) => {
        it(`parses ${name}`, () => {
            const root = parse(css, {from: name});
            const parsed = cases.jsonify(root);
            expect(parsed).to.eql(json);
        });
    });

    it('parses nested rules', () => {
        const root = parse('a { b {} }');
        expect(root.first.first.selector).to.eql('b');
    });

    it('parses at-rules inside rules', () => {
        const root = parse('a { @media {} }');
        expect(root.first.first.name).to.eql('media');
    });

    it('parses variables', () => {
        const root = parse('@var: 1;');
        expect(root.first.prop).to.eql('@var');
        expect(root.first.value).to.eql('1');
    });

    it('parses inline comments', () => {
        const root = parse('\n// a \n/* b */');
        expect(root.nodes).to.have.length(2);
        expect(root.first.text).to.eql('a');
        expect(root.first.raws).to.eql({
            before: '\n',
            left: ' ',
            right: ' ',
            inline: true
        });

        expect(root.last.text).to.eql('b');
    });

    it('parses empty inline comments', () => {
        const root = parse('//\n// ');
        expect(root.first.text).to.eql('');
        expect(root.first.raws).to.eql({
            before: '',
            left: '',
            right: '',
            inline: true
        });

        expect(root.last.text).to.eql('');
        expect(root.last.raws).to.eql({
            before: '\n',
            left: ' ',
            right: '',
            inline: true
        });
    });

    it('does not parse comments inside brackets', () => {
        const root = parse('a { cursor: url(http://ya.ru) }');
        expect(root.first.first.value).to.eql('url(http://ya.ru)');
    });

    it('parses interpolation', () => {
        const root = parse('@{selector}:hover { @{prop}-size: @{color} }');
        expect(root.first.selector).to.eql('@{selector}:hover');
        expect(root.first.first.prop).to.eql('@{prop}-size');
        expect(root.first.first.value).to.eql('@{color}');
    });

    it('parses interpolation inside word', () => {
        let root = parse('.@{class} {}');
        expect(root.first.selector).to.eql('.@{class}');
    });
});