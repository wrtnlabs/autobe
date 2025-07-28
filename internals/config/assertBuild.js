const fs = require("fs");

console.log("Checking build output...");
if (
  (fs.existsSync("lib/index.js") === false &&
    fs.existsSync("lib/index.mjs") === false) ||
  fs.existsSync("lib/index.d.ts") === false
) {
  console.log("Root folder of build output is not lib.");
  process.exit(-1);
}
