const cp = require("child_process");
const execute = (name) => {
  console.log(`Installing dependencies for ${JSON.stringify(name)}...`);
  const cwd = `${__dirname}/../internals/${name}`;
  cp.execSync("npm install", {
    cwd,
    stdio: "ignore",
  });
};
execute("nestjs-dependencies");
execute("test-dependencies");
