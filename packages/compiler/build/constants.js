const fs = require("fs");

const main = async () => {
  const readme = await fs.promises.readFile(
    `${__dirname}/../../../internals/documents/README.md`,
    "utf8",
  );
  try {
    await fs.promises.mkdir(`${__dirname}/../src/raw`);
  } catch {}
  await fs.promises.writeFile(
    `${__dirname}/../src/raw/AutoBeCompilerConstants.ts`,
    [
      `export const enum AutoBeCompilerConstants {`,
      `  README = ${JSON.stringify(readme, null, 2)}`,
      `}`,
    ].join("\n"),
    "utf8",
  );
};
main().catch((error) => {
  console.error(error);
  process.exit(-1);
});
