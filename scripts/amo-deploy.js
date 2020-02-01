var fs = require("fs");
var deploy = require("firefox-extension-deploy");

deploy({
  // obtained by following the instructions here:
  // https://addons-server.readthedocs.io/en/latest/topics/api/auth.html
  // or from this page:
  // https://addons.mozilla.org/en-US/developers/addon/api/key/
  issuer: process.env.AMO_ISSUER,
  secret: process.env.AMO_SECRET,

  // the ID of your extension
  id: "{adc96546-ad4d-4b76-9df3-84cdd73af6fa}",
  // the version to publish
  version: process.env.npm_package_version,

  // a ReadStream containing a .zip (WebExtensions) or .xpi (Add-on SDK)
  src: fs.createReadStream("./dist/ita-matrix-powertools.webext.zip")
}).then(
  function() {
    // success!
  },
  function(err) {
    // failure :(
  }
);
