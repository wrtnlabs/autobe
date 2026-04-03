import { TestValidator } from "@nestia/e2e";
import fs from "fs";

import { TestGlobal } from "../../TestGlobal";

export const test_schema_preliminary_complete = async (): Promise<void> => {
  const container: string[] = [];
  for (const phase of [
    "analyze",
    "prisma",
    "database",
    "interface",
    "test",
    "realize",
  ]) {
    const directory: string = `${TestGlobal.ROOT}/../packages/agent/src/orchestrate/${phase}/structures`;
    if (fs.existsSync(directory) === false) continue;
    await visitDirectory({
      container,
      directory,
    });
  }
  TestValidator.equals("predicate", container, []);
};

const visitDirectory = async (props: {
  container: string[];
  directory: string;
}): Promise<void> => {
  for (const file of await fs.promises.readdir(props.directory))
    if (file.startsWith("I") && file.endsWith("Application.ts"))
      await visitFile({
        container: props.container,
        directory: props.directory,
        file,
      });
};

const visitFile = async (props: {
  container: string[];
  directory: string;
  file: string;
}): Promise<void> => {
  const content = await fs.promises.readFile(
    `${props.directory}/${props.file}`,
    "utf-8",
  );
  if (
    content.includes("IAutoBePreliminary") === true &&
    content.includes("IAutoBePreliminaryComplete") === false
  )
    props.container.push(props.file);
};
