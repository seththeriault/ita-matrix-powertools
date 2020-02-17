const archiver = require("archiver");
const fs = require("fs");
const path = require("path");

const { replace } = require("./replaceTokens");

const dist = path.resolve(__dirname, "../dist");
if (!fs.existsSync(dist)) {
  fs.mkdirSync(dist);
}
const output = fs.createWriteStream(
  path.resolve(dist, "ita-matrix-powertools.webext.zip")
);
const archive = archiver("zip", {
  zlib: { level: 9 }
});

// listen for all archive data to be written
// 'close' event is fired only when a file descriptor is involved
output.on("close", function() {
  console.log(archive.pointer() + " total bytes");
  console.log(
    "archiver has been finalized and the output file descriptor has closed."
  );
});

// This event is fired when the data source is drained no matter what was the data source.
// It is not part of this library but rather from the NodeJS Stream API.
// @see: https://nodejs.org/api/stream.html#stream_event_end
output.on("end", function() {
  console.log("Data has been drained");
});

// good practice to catch warnings (ie stat failures and other non-blocking errors)
archive.on("warning", function(err) {
  if (err.code === "ENOENT") {
    // log warning
    console.warn(err);
  } else {
    console.error(err);
    // throw error
    throw err;
  }
});

// good practice to catch this error explicitly
archive.on("error", function(err) {
  console.error(err);
  throw err;
});

// pipe archive data to the file
archive.pipe(output);

// append the web extension manifest
archive.append(
  replace(fs.readFileSync(path.resolve(__dirname, "../manifest.json"), "utf8")),
  { name: "manifest.json" }
);

// append the script file
archive.file(path.resolve(__dirname, "../ita-matrix-powertools.user.js"), {
  name: "ita-matrix-powertools.user.js"
});

// append icons
archive.directory(path.resolve(__dirname, "../icons/"), "icons");

// finalize the archive (ie we are done appending files but streams have to finish yet)
// 'close', 'end' or 'finish' may be fired right after calling this method so register to them beforehand
archive.finalize();
