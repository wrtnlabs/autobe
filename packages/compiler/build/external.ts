import cp from "child_process";
import path from "path";

function external(name: string): void {
  const dependencies: string = path.resolve(
    `${__dirname}/../../../internals/${name}-dependencies`,
  );
  console.log(`- Processing ${name} dependencies: ${dependencies}`);
  console.log(`  - installing...`);
  cp.execSync("npm install", {
    stdio: "ignore",
    cwd: dependencies,
  });
  console.log(`  - Building...`);

  const input: string = `--input ${dependencies}`;
  const output: string = [
    "--output",
    path.resolve(__dirname, "..", "src", "raw", `${name}.json`),
  ].join(" ");
  cp.execSync(`embed-typescript external ${input} ${output}`, {
    stdio: "ignore",
    cwd: path.resolve(__dirname, ".."),
  });
}

console.log("Compiler Dependencies");
external("nestjs");
external("test");
