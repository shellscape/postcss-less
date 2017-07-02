// chai uses expressions for validation
/* eslint no-unused-expressions: 0 */

import CssSyntaxError from 'postcss/lib/css-syntax-error';
import Import from '../lib/import';
import { expect } from 'chai';
import lessSyntax from '../lib/less-syntax';
import postcss from 'postcss';

describe('#postcss', () => {
  it('should process LESS syntax', (done) => {
    const lessText = 'a { b {} }';

    postcss()
      .process(lessText, { syntax: lessSyntax })
      .then((result) => {
        expect(result).to.be.not.null;
        expect(result.css).to.equal(lessText);
        expect(result.content).to.equal(lessText);

        done();
      }).catch(done);
  });

  it('should parse LESS mixins as at rules', (done) => {
    const lessText = '.foo (@bar; @baz...) { border: @{baz}; }';

    postcss()
      .process(lessText, { syntax: lessSyntax })
      .then((result) => {
        expect(result).to.be.not.null;
        expect(result.css).to.equal(lessText);
        expect(result.content).to.equal(lessText);

        done();
      }).catch(done);
  });

  it('should not parse invalid LESS (#64)', (done) => {
    const lessText = '.foo';

    postcss()
      .process(lessText, { syntax: lessSyntax })
      .catch((err) => {
        expect(err).to.be.an.instanceof(CssSyntaxError);
        done();
      });
  });

  it('should parse @imports as Import', (done) => {
    const lessText = '@import (inline) "foo.less";';

    postcss()
      .process(lessText, { syntax: lessSyntax })
      .then((result) => {
        expect(result).to.be.not.null;
        expect(result.css).to.equal(lessText);
        expect(result.root.first).to.be.an.instanceof(Import);
        expect(result.root.first.directives).to.equal('(inline)');
        expect(result.root.first.importPath).to.equal('"foo.less"');

        done();
      }).catch(done);
  });

  it('should create its own Root node stringifier (#82)', (done) => {
    const lessText = '@import "foo.less"';

    postcss()
      .process(lessText, { syntax: lessSyntax })
      .then((result) => {
        expect(result.root.toString()).to.eql(lessText);

        done();
      }).catch(done);
  });
});
