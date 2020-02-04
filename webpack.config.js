const webpack = require("webpack");
const fs = require("fs");
const path = require("path");

const replaceTokens = require("./scripts/replaceTokens");

module.exports = {
  entry: "./src/index.js",
  output: {
    filename: "ita-matrix-powertools.user.js",
    path: __dirname
  },
  optimization: {
    minimize: false
  },
  plugins: [
    new webpack.BannerPlugin({
      banner: replaceTokens(
        fs.readFileSync(path.resolve(__dirname, "header.js"), "utf8")
      ),
      raw: true
    }),
    new webpack.DefinePlugin({
      __VERSION__: JSON.stringify(process.env.npm_package_version)
    })
  ]
};
