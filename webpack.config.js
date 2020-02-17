const webpack = require("webpack");
const fs = require("fs");
const path = require("path");

const { replace, tokens } = require("./scripts/replaceTokens");

// Moment Timezone (for AA Sabre):
const MomentTimezoneDataPlugin = require("moment-timezone-data-webpack-plugin");
const MomentLocalesPlugin = require("moment-locales-webpack-plugin");
const currentYear = new Date().getFullYear();

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
      banner: replace(
        fs.readFileSync(path.resolve(__dirname, "header.js"), "utf8")
      ),
      raw: true
    }),
    new webpack.DefinePlugin(
      Object.keys(tokens).reduce((res, token) => {
        res[token] = JSON.stringify(tokens[token]);
        return res;
      }, {})
    ),
    new MomentTimezoneDataPlugin({
      startYear: currentYear,
      endYear: currentYear + 2
    }),
    // Strip all Moment locales except “en”, “es-us” and “de”
    // (“en” is built into Moment and can’t be removed)
    new MomentLocalesPlugin({
      localesToKeep: ["de"]
    })
  ]
};
