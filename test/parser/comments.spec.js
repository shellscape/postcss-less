// chai uses expressions for validation
/* eslint no-unused-expressions: 0 */

import {expect} from 'chai';
import parse from '../../lib/less-parse';

describe('Parser', () => {
    describe('Comments', () => {
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
            const root = parse('a { cursor: url(http://site.com) }');

            expect(root.first.first.value).to.eql('url(http://site.com)');
        });
    });
});