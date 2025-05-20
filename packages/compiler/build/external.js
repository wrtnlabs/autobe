const cp = require("child_process");
const path = require("path");

const dependencies = path.resolve(
  `${__dirname}/../../../assets/compiler-dependencies`,
);

console.log("---------------------------------------");
console.log(" Installing compiler dependencies");
console.log("---------------------------------------");
cp.execSync("npm install", {
  stdio: "inherit",
  cwd: dependencies,
});

console.log();
console.log("---------------------------------------");
console.log(" Building compiler dependencies");
console.log("---------------------------------------");

const input = `--input ${dependencies}`;
const output = [
  "--output",
  path.resolve(__dirname, "..", "src", "raw", "external.json"),
].join(" ");

cp.execSync(`embed-typescript external ${input} ${output}`, {
  stdio: "inherit",
  cwd: path.resolve(__dirname, ".."),
});
