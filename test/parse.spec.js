import parse from '../lib/less-parse';
import {expect} from 'chai';
import cases from 'postcss-parser-tests';

describe('#parse()', () => {
    //describe('CSS for PostCSS', () => {
    //    cases.each((name, css, json) => {
    //        it(`parses ${name}`, () => {
    //            const root = parse(css, {from: name});
    //            const parsed = cases.jsonify(root);
    //            expect(parsed).to.eql(json);
    //        });
    //    });
    //
    //    it('parses nested rules', () => {
    //        const root = parse('a { b {} }');
    //        expect(root.first.first.selector).to.eql('b');
    //    });
    //
    //    it('parses at-rules inside rules', () => {
    //        const root = parse('a { @media {} }');
    //        expect(root.first.first.name).to.eql('media');
    //    });
    //});
    //
    //describe('Variables', () => {
    //    it('parses variables', () => {
    //        const root = parse('@var: 1;');
    //        expect(root.first.prop).to.eql('@var');
    //        expect(root.first.value).to.eql('1');
    //    });
    //
    //    it('parses interpolation', () => {
    //        const root = parse('@{selector}:hover { @{prop}-size: @{color} }');
    //        expect(root.first.selector).to.eql('@{selector}:hover');
    //        expect(root.first.first.prop).to.eql('@{prop}-size');
    //        expect(root.first.first.value).to.eql('@{color}');
    //    });
    //
    //    it('parses interpolation inside word', () => {
    //        const root = parse('.@{class} {}');
    //        expect(root.first.selector).to.eql('.@{class}');
    //    });
    //});
    //
    //describe('Comments', () => {
    //    it('parses inline comments', () => {
    //        const root = parse('\n// a \n/* b */');
    //        expect(root.nodes).to.have.length(2);
    //        expect(root.first.text).to.eql('a');
    //        expect(root.first.raws).to.eql({
    //            before: '\n',
    //            left: ' ',
    //            right: ' ',
    //            inline: true
    //        });
    //
    //        expect(root.last.text).to.eql('b');
    //    });
    //
    //    it('parses empty inline comments', () => {
    //        const root = parse('//\n// ');
    //        expect(root.first.text).to.eql('');
    //        expect(root.first.raws).to.eql({
    //            before: '',
    //            left: '',
    //            right: '',
    //            inline: true
    //        });
    //
    //        expect(root.last.text).to.eql('');
    //        expect(root.last.raws).to.eql({
    //            before: '\n',
    //            left: ' ',
    //            right: '',
    //            inline: true
    //        });
    //    });
    //
    //    it('does not parse comments inside brackets', () => {
    //        const root = parse('a { cursor: url(http://ya.ru) }');
    //        expect(root.first.first.value).to.eql('url(http://ya.ru)');
    //    });
    //});
    //
    //describe('Extend', () => {
    //    it('parses inline &:extend()', () => {
    //        const css = '.a:extend(.b) {color: red;}';
    //        const root = parse(css);
    //        expect(root.first.selector).to.eql('.a:extend(.b)');
    //    });
    //
    //    it('parses inline &:extend() with multiple parameters', () => {
    //        const css = '.e:extend(.f, .g) {}';
    //        const root = parse(css);
    //        expect(root.first.selector).to.eql('.e:extend(.f, .g)');
    //    });
    //
    //    it('parses inline &:extend() with nested selector in parameters', () => {
    //        const css = '.e:extend(.a .g, b span) {}';
    //        const root = parse(css);
    //        expect(root.first.selector).to.eql('.e:extend(.a .g, b span)');
    //    });
    //
    //    it('parses multiline &:extend()', () => {
    //        const css = '.a {\n&:extend(.b);\n}';
    //        const root = parse(css);
    //        expect(root.first.selector).to.eql('.a');
    //        expect(root.first.first.prop).to.eql('&');
    //        expect(root.first.first.value).to.eql('extend(.b)');
    //    });
    //
    //    it('parses :extend() after selector', () => {
    //        const css = 'pre:hover:extend(div pre){}';
    //        const root = parse(css);
    //        expect(root.first.selector).to.eql('pre:hover:extend(div pre)');
    //    });
    //
    //    it('parses :extend() after selector. 2', () => {
    //        const css = 'pre:hover :extend(div pre){}';
    //        const root = parse(css);
    //        expect(root.first.selector).to.eql('pre:hover :extend(div pre)');
    //    });
    //
    //    it('parses multiple extends', () => {
    //        const css = 'pre:hover:extend(div pre):extend(.bucket tr) { }';
    //        const root = parse(css);
    //        expect(root.first.selector).to.eql('pre:hover:extend(div pre):extend(.bucket tr)');
    //    });
    //
    //    it('parses nth expression in extend', () => {
    //        const css = ':nth-child(1n+3) {color: blue;} .child:extend(:nth-child(n+3)) {}';
    //        const root = parse(css);
    //        expect(root.first.selector).to.eql(':nth-child(1n+3)');
    //        expect(root.nodes[1].selector).to.eql('.child:extend(:nth-child(n+3))');
    //    });
    //
    //    it('parses extend "all"', () => {
    //        const css = '.replacement:extend(.test all) {}';
    //        const root = parse(css);
    //        expect(root.first.selector).to.eql('.replacement:extend(.test all)');
    //    });
    //
    //    it('parses extend with interpolation', () => {
    //        const css = '.bucket {color: blue;}\n.some-class:extend(@{variable}) {}\n@variable: .bucket;';
    //        const root = parse(css);
    //        expect(root.nodes[0].selector).to.eql('.bucket');
    //        expect(root.nodes[1].selector).to.eql('.some-class:extend(@{variable})');
    //    });
    //});

    describe('Mixins', () => {
        it('parses nested mixins', () => {
            //const css = `.highlight {
            //    @t_trans-duration: 0.9s;
            //    @c_less: @c_red2;
            //    @c_more: @c_green2;
            //    @s_padding: round(10/3);
            //
            //    .icon {
            //        display: block;
            //    }
            //
            //    .m_transition(background-color @t_trans-duration, color @t_trans-duration) ;
            //
            //    &_more,
            //    &_less {
            //        .m_transition (none);
            //        color: @c_white;
            //    }
            //
            //    &_less {
            //        background-color: @c_less;
            //    }
            //
            //    &_more {
            //        background-color: @c_more;
            //    }
            //}`;

            const css = '.a{\n.m_transition (none); \n.b {}}';
            const root = parse(css);
            console.log(root.first.first.selector);
        });
    });
});