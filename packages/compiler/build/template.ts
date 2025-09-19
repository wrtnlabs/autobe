import { FileSystemIterator } from "@autobe/filesystem";
import fs from "fs";

const template = async (props: {
  root: string;
  name: string;
  files?: Record<string, string>;
}): Promise<void> => {
  const files: Record<string, string> = await FileSystemIterator.read({
    root: props.root,
  });
  await fs.promises.writeFile(
    `${__dirname}/../src/raw/${props.name}.ts`,
    [
      `export const ${props.name}: Record<string, string> = ${JSON.stringify(
        {
          ...files,
          ...props.files,
        },
        null,
        2,
      )};`,
    ].join("\n"),
    "utf8",
  );
};

const getDefinition = async (src: string): Promise<Record<string, string>> => ({
  [`test/autobe/${src}`]: [
    "//---------------------------------------------------",
    "// Cloned from @autobe/interface",
    "//---------------------------------------------------",
    await fs.promises.readFile(
      `${__dirname}/../../interface/src/${src}`,
      "utf8",
    ),
  ].join("\n"),
});

const main = async (): Promise<void> => {
  try {
    await fs.promises.mkdir(`${__dirname}/../src/raw`);
  } catch {}
  await template({
    root: `${__dirname}/../../../internals/template/interface`,
    name: "AutoBeCompilerInterfaceTemplate",
  });
  await template({
    root: `${__dirname}/../../../internals/template/test`,
    name: "AutoBeCompilerTestTemplate",
  });
  await template({
    root: `${__dirname}/../../../internals/template/realize`,
    name: "AutoBeCompilerRealizeTemplate",
    files: {
      ...(await getDefinition("compiler/IAutoBeRealizeTestOperation.ts")),
      ...(await getDefinition("compiler/IAutoBeRealizeTestConfig.ts")),
      ...(await getDefinition("compiler/IAutoBeRealizeTestResult.ts")),
      ...(await getDefinition("compiler/IAutoBeRealizeTestListener.ts")),
      ...(await getDefinition("compiler/IAutoBeRealizeTestService.ts")),
    },
  });
  await template({
    root: `${__dirname}/../../../internals/template/realize-of-postgres`,
    name: "AutoBeCompilerRealizeTemplateOfPostgres",
  });
  await template({
    root: `${__dirname}/../../../internals/template/realize-of-sqlite`,
    name: "AutoBeCompilerRealizeTemplateOfSQLite",
  });
};
main().catch((error) => {
  console.error(error);
  process.exit(-1);
});
