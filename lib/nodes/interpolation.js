/* eslint no-param-reassign: off */

module.exports = {
  interpolation(token) {
    let first = token;
    const tokens = [token];
    const validTypes = ['word', '{', '}'];

    token = this.tokenizer.nextToken();

    // look for @{ but not @[word]{
    if (first[1].length > 1 || token[0] !== '{') {
      this.tokenizer.back(token);
      return false;
    }

    while (token && validTypes.includes(token[0])) {
      tokens.push(token);
      token = this.tokenizer.nextToken();
    }

    const words = tokens.map((tokn) => tokn[1]);
    [first] = tokens;
    const last = tokens.pop();
    const newToken = ['word', words.join(''), first[2], last[2]];

    this.tokenizer.back(token);
    this.tokenizer.back(newToken);

    return true;
  }
};
