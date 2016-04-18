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
    });
});