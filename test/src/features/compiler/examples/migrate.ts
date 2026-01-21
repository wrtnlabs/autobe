import { AutoBeDatabase } from "@autobe/interface";
import { RandomGenerator } from "@nestia/e2e";
import fs from "fs";

const migrate = async (file: string): Promise<void> => {
  const application: AutoBeDatabase.IApplication = JSON.parse(
    await fs.promises.readFile(`${__dirname}/${file}`, "utf-8"),
  );
  for (const model of application.files.flatMap((f) => f.models))
    for (const ff of model.foreignFields)
      ff.relation.oppositeName = RandomGenerator.alphabets(16);
  await fs.promises.writeFile(
    `${__dirname}/${file}`,
    JSON.stringify(application),
    "utf8",
  );
};

const main = async () => {
  const directory: string[] = await fs.promises.readdir(__dirname);
  for (const file of directory)
    if (file.startsWith("prisma.") && file.endsWith(".json"))
      await migrate(file);
};
main().catch(console.error);
