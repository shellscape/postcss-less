module.exports = {
  isInlineComment(token) {
    if (token[0] === 'word' && token[1].slice(0, 2) === '//') {
      const first = token;
      const bits = [];
      let last;

      while (token && !/\n/.test(token[1])) {
        bits.push(token[1]);
        last = token;
        // eslint-disable-next-line no-param-reassign
        token = this.tokenizer.nextToken({ ignoreUnclosed: true });
      }

      if (token) {
        bits.push(token[1]);
      }

      const newToken = ['comment', bits.join(''), first[2], first[3], last[2], last[3]];

      this.inlineComment(newToken);
      return true;
    }
    return false;
  }
};
