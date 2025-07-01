import cp from "child_process";
import fs from "fs";
import { Singleton, VariadicSingleton } from "tstl";

export function getLocalSourceFile(location: string): Promise<string> {
  return loader.get(location);
}

const loader = new VariadicSingleton(async (location) => {
  if (location.endsWith(".d.ts") && location.startsWith("packages/")) {
    const name: string = location.split("/")[1];
    await declaration.get(name);
  }
  const absolute: string = `${await root.get()}/${location}`;
  const content: string = await fs.promises.readFile(absolute, "utf8");
  return location.endsWith(".d.ts")
    ? content.split("    ").join("  ")
    : content;
});

const root = new Singleton(async () => {
  let cwd: string = `${__dirname}/..`;
  while (true) {
    cwd += "/..";
    if (fs.existsSync(`${cwd}/package.json`) === false) continue;
    const { name } = JSON.parse(
      await fs.promises.readFile(`${cwd}/package.json`, "utf8"),
    );
    if (name === "@autobe/station") break;
  }
  return cwd;
});

const declaration = new Singleton(async (name: string) => {
  const cwd: string = `${await root.get()}/packages/${name}`;
  if (fs.existsSync(`${cwd}/lib`)) return;
  cp.execSync("pnpm run build", { cwd });
});
