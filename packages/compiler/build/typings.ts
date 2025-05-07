/// <reference types="node" />
import cp from "child_process";
import fs from "fs";

interface IFile {
  import: string;
  variable: string;
  url: string;
  format: string;
  content: string;
}

const COMPILER_DEPENDENCIES = `${__dirname}/../../compiler-dependencies`;

const collectDefinitions = async (
  lib: string,
  root: string = `${COMPILER_DEPENDENCIES}/node_modules/${lib}`,
): Promise<Record<string, string>> => {
  const container: Record<string, string> = {};

  // iterate d.ts files
  const iterate = async (location: string): Promise<void> => {
    const directory: string[] = await fs.promises.readdir(location);
    for (const file of directory) {
      const next: string = `${location}/${file}`;
      const stats: fs.Stats = await fs.promises.stat(next);
      if (file === "node_modules" && stats.isDirectory())
        for (const il of await fs.promises.readdir(next)) {
          const ilNext: string = `${next}/${il}`;
          const ilStats: fs.Stats = await fs.promises.stat(ilNext);
          if (ilStats.isDirectory() && fs.existsSync(`${ilNext}/package.json`))
            await collectDefinitions(il, ilNext);
        }
      else if (stats.isDirectory()) await iterate(next);
      else if (
        file.endsWith(".d.ts") ||
        (location == root && file === "package.json")
      ) {
        container[`node_modules/${lib}${next.substring(root.length)}`] =
          await fs.promises.readFile(next, "utf8");
      }
    }
  };
  await iterate(root);
  return container;
};

const getDependencies = async (): Promise<string[]> => {
  interface IPackageJson {
    packages: Record<string, unknown>;
  }
  const { packages } = JSON.parse(
    await fs.promises.readFile(
      `${COMPILER_DEPENDENCIES}/package-lock.json`,
      "utf8",
    ),
  ) as IPackageJson;
  return Object.keys(packages)
    .filter((lib) => lib.startsWith("node_modules/"))
    .map((lib) => lib.substring("node_modules/".length));
};

const main = async () => {
  cp.execSync("npm install", {
    cwd: COMPILER_DEPENDENCIES,
    stdio: "ignore",
  });

  const container: Record<string, string> = {};
  for (const lib of await getDependencies()) {
    const definitions: Record<string, string> = await collectDefinitions(lib);
    Object.assign(container, definitions);
  }

  await fs.promises.writeFile(
    `${__dirname}/../src/raw/typings.json`,
    JSON.stringify(container),
    "utf8",
  );
};
main().catch((error) => {
  console.error(error);
  process.exit(-1);
});
