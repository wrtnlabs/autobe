/// <reference types="node" />

import fs from "fs";
import { VariadicSingleton } from "tstl";

interface IFile {
  import: string;
  variable: string;
  url: string;
  format: string;
  content: string;
}

const COMPILER_DEPENDENCIES = `${__dirname}/../../compiler-dependencies`;
const RAW_OUTPUT = `${__dirname}/../src/raw/typings`;

const collectDefinitions = async (lib: string): Promise<IFile[]> => {
  const root: string = `${COMPILER_DEPENDENCIES}/node_modules/${lib}`;
  const container: IFile[] = [];

  // iterate d.ts files
  const iterate = async (location: string): Promise<void> => {
    const directory: string[] = await fs.promises.readdir(location);
    for (const file of directory) {
      const next: string = `${location}/${file}`;
      const stats: fs.Stats = await fs.promises.stat(next);
      if (stats.isDirectory()) await iterate(next);
      else if (
        file.endsWith(".d.ts") ||
        (location == root && file === "package.json")
      ) {
        const absolute: string = `${lib}${next.substring(root.length)}`;
        const alias: string = absolute.substring(0, absolute.length - 5);
        const variable: string = emendName(alias);
        container.push({
          variable,
          format: file.endsWith(".d.ts") ? "ts" : "json",
          import: `./${alias}`,
          url: `file:///node_modules/${alias}`,
          content: await fs.promises.readFile(next, "utf8"),
        });
      }
    }
  };
  await iterate(root);

  // check package.json file
  interface IPackageJson {
    types?: string;
    typings?: string;
  }
  const pack: IPackageJson = JSON.parse(
    await fs.promises.readFile(
      `${COMPILER_DEPENDENCIES}/node_modules/${lib}/package.json`,
      "utf8"
    )
  );
  return container;
};

const emendName = (str: string) =>
  str
    .replaceAll("@", "_at_")
    .replaceAll("/", "_slash_")
    .replaceAll("-", "_dash_")
    .replaceAll("/", "_")
    .replaceAll(".", "_");

const getDependencies = async (): Promise<string[]> => {
  interface IPackageJson {
    devDependencies: Record<string, string>;
  }
  const { devDependencies } = JSON.parse(
    await fs.promises.readFile(`${COMPILER_DEPENDENCIES}/package.json`, "utf8")
  ) as IPackageJson;
  return Object.keys(devDependencies);
};

const main = async () => {
  if (fs.existsSync(RAW_OUTPUT))
    await fs.promises.rm(RAW_OUTPUT, {
      recursive: true,
      force: true,
    });
  const mkdir = new VariadicSingleton(async (s: string) => {
    try {
      await fs.promises.mkdir(s, {
        recursive: true,
      });
    } catch {}
  });

  const container: IFile[] = [];
  for (const lib of await getDependencies())
    for (const file of await collectDefinitions(lib)) {
      const location: string = `${RAW_OUTPUT}/${file.import}.ts`;
      await mkdir.get(location.substring(0, location.lastIndexOf("/")));
      await fs.promises.writeFile(
        location,
        `export const ${file.variable}: string = ${JSON.stringify(file.content)}`,
        "utf8"
      );
      container.push(file);
    }

  await fs.promises.writeFile(
    `${RAW_OUTPUT}/RAW_TYPINGS.ts`,
    [
      ...container.map(
        (file) =>
          `import { ${file.variable} } from ${JSON.stringify(file.import)}`
      ),
      "",
      `export const RAW_TYPINGS: [file: string, content: string][] = [`,
      ...container.map(
        (file) => `[${JSON.stringify(file.url)}, ${file.variable}],`
      ),
      "]",
    ].join("\n"),
    "utf8"
  );
};
main().catch((error) => {
  console.error(error);
  process.exit(-1);
});
