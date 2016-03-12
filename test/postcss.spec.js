/* global describe, xdescribe, it, xit */

import postcss from 'postcss';
import lessSyntax from '../lib/less-syntax';

import { expect } from 'chai';

describe('#postcss', () => {
  it('can process LESS syntax', () => {
    const lessText = 'a { b {} }';

    postcss()
      .process(lessText, { syntax: lessSyntax })
      .then((result) => {
        expect(result).to.be.not.null;
        expect(result.css).to.equal(lessText);
        expect(result.content).to.equal(lessText);
      });
  });
});
