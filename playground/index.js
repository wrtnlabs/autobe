const cp = require("child_process");

const execWithStreaming = (command, options) =>
  new Promise((resolve, reject) => {
    const process = cp.exec(command, options);
    process.stdout.on("data", (data) => {
      console.log(data.toString());
    });
    process.stderr.on("data", (data) => {
      console.error(data.toString());
    });
    process.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Process exited with code ${code}`));
      }
    });
  });

const main = async () => {
  await Promise.all([
    execWithStreaming("pnpm run start", {
      cwd: `${__dirname}/../apps/playground-server`,
    }),
    execWithStreaming("pnpm run dev", {
      cwd: `${__dirname}/../apps/playground-ui`,
    }),
  ]);
};
main().catch((err) => {
  console.error(err);
  process.exit(-1);
});
