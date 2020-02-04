module.exports = function(value) {
  return value
    .replace("__DESCRIPTION__", process.env.npm_package_description)
    .replace("__VERSION__", process.env.npm_package_version);
};
