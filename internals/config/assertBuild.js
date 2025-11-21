const fs = require("fs");

console.log("Checking build output...");

const src = fs
  .readdirSync("src")
  .filter((file) => file !== ".DS_Store")
  .map((file) => (file.endsWith(".ts") ? file.replace(".ts", ".js") : file));
const lib = fs.readdirSync("lib");

if (src.every((x) => lib.includes(x)) === false) {
  console.log("Root folder of build output is not lib.");
  process.exit(-1);
}
