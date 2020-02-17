const tokens = {
  __VERSION__: process.env.npm_package_version,
  __DESCRIPTION__: process.env.npm_package_description
};

module.exports = {
  tokens,
  replace: function(value) {
    return Object.keys(tokens).reduce(
      (res, token) => res.replace(token, tokens[token]),
      value
    );
  }
};
