import cp from "child_process";
import path from "path";

const dependencies: string = path.resolve(
  `${__dirname}/../../../internals/compiler-dependencies`,
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

const input: string = `--input ${dependencies}`;
const output: string = [
  "--output",
  path.resolve(__dirname, "..", "src", "raw", "external.json"),
].join(" ");

cp.execSync(`embed-typescript external ${input} ${output}`, {
  stdio: "inherit",
  cwd: path.resolve(__dirname, ".."),
});
