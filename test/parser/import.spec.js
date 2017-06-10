// chai uses expressions for validation
/* eslint no-unused-expressions: 0 */

import Import from '../../lib/import';
import { expect } from 'chai';
import lessSyntax from '../../lib/less-syntax';
import postcss from 'postcss';

describe('Parser', () => {
  describe('Import', () => {
    it('should parse @imports as Import', (done) => {
      const lessText = '@import "foo.less";';

      postcss()
              .process(lessText, { syntax: lessSyntax })
              .then((result) => {
                expect(result).to.be.not.null;
                expect(result.css).to.equal(lessText);
                expect(result.root.first).to.be.an.instanceof(Import);
                expect(result.root.first.importPath).to.equal('"foo.less"');

                done();
              }).catch(done);
    });

    it('should parse @imports with a url function as Import', (done) => {
      const lessText = '@import url("foo.less");';

      postcss()
              .process(lessText, { syntax: lessSyntax })
              .then((result) => {
                expect(result).to.be.not.null;
                expect(result.css).to.equal(lessText);
                expect(result.root.first).to.be.an.instanceof(Import);
                expect(result.root.first.importPath).to.equal('"foo.less"');
                expect(result.root.first.urlFunc).to.equal(true);

                done();
              }).catch(done);
    });

    it('should parse @imports with a quote-less url function as Import', (done) => {
      const lessText = '@import url(foo.less);';

      postcss()
              .process(lessText, { syntax: lessSyntax })
              .then((result) => {
                expect(result).to.be.not.null;
                expect(result.css).to.equal(lessText);
                expect(result.root.first).to.be.an.instanceof(Import);
                expect(result.root.first.importPath).to.equal('foo.less');
                expect(result.root.first.urlFunc).to.equal(true);

                done();
              }).catch(done);
    });

    it('should parse @imports as Import, no space', (done) => {
      const lessText = '@import"foo.less";';

      postcss()
              .process(lessText, { syntax: lessSyntax })
              .then((result) => {
                expect(result).to.be.not.null;
                expect(result.css).to.equal(lessText);
                expect(result.root.first).to.be.an.instanceof(Import);
                expect(result.root.first.importPath).to.equal('"foo.less"');
                expect(result.root.first.raws.afterName).to.be.undefined;

                done();
              }).catch(done);
    });

    it('should parse @imports with directives', (done) => {
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
  });
});
