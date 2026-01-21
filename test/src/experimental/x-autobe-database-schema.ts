import { AutoBeJsonSchemaFactory } from "@autobe/agent/src/orchestrate/interface/utils/AutoBeJsonSchemaFactory";
import { AutoBeExampleStorage } from "@autobe/benchmark";
import { AutoBeHistory } from "@autobe/interface";
import { AutoBeOpenApiTypeChecker } from "@autobe/utils";

const main = async (): Promise<void> => {
  const histories: AutoBeHistory[] = await AutoBeExampleStorage.getHistories({
    vendor: "qwen/qwen3-next-80b-a3b-instruct",
    project: "bbs",
    phase: "interface",
  });

  const { data: application } = histories.find(
    (h) => h.type === "database",
  )!.result;
  const { document } = histories.find((h) => h.type === "interface")!;

  const print = () => {
    for (const [key, value] of Object.entries(document.components.schemas))
      if (key.startsWith("IPage")) continue;
      else if (AutoBeOpenApiTypeChecker.isObject(value))
        console.log(`${key} -> ${value["x-autobe-database-schema"]}`);
  };

  AutoBeJsonSchemaFactory.finalize({
    document,
    application,
  });
  for (const model of application.files.flatMap((f) => f.models))
    console.log(`${model.name}`);
  print();
};
main().catch(console.error);
