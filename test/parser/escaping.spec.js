// chai uses expressions for validation
/* eslint no-unused-expressions: 0 */

import {expect} from 'chai';
import parse from '../../lib/less-parse';

describe('Parser', () => {
    describe('Escaping', () => {
        it('parses escaped string', () => {
            const code = `
                @testVar: 10px;
            
                .test-wrap {
                    .selector {
                        height: calc(~"100vh - @{testVar}");
                    }
                }
            `;
            const root = parse(code);

            expect(root.first.prop).to.eql('@testVar');
            expect(root.first.value).to.eql('10px');
            expect(root.last.first.first.prop).to.eql('height');
            expect(root.last.first.first.value).to.eql('calc(~"100vh - @{testVar}")');
        });

        it('parses escaping inside nested rules', () => {
            const code = `
                .test1 {
                    .another-test {
                        prop1: function(~"@{variable}");
                    }
                }
                
                .test2 {
                    prop2: function(~\`@{test}\`);
                }
                
                .test3 {
                    filter: ~"alpha(opacity='@{opacity}')";
                }
            `;
            const root = parse(code);

            expect(root.nodes[0].first.first.prop).to.eql('prop1');
            expect(root.nodes[0].first.first.value).to.eql('function(~"@{variable}")');
            expect(root.nodes[1].first.prop).to.eql('prop2');
            expect(root.nodes[1].first.value).to.eql('function(~`@{test}`)');
            expect(root.nodes[2].first.prop).to.eql('filter');
            expect(root.nodes[2].first.value).to.eql('~"alpha(opacity=\'@{opacity}\')"');
        });
    });
});