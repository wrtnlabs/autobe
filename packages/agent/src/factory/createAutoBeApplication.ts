import { IAgenticaController } from "@agentica/core";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import typia from "typia";

import { AutoBeContext } from "../context/AutoBeContext";
import { IAutoBeApplication } from "../context/IAutoBeApplication";
import { assertSchemaModel } from "../context/assertSchemaModel";
import { orchestrateInterface } from "../orchestrate/interface/orchestrateInterface";
import { orchestrateAnalyze } from "../orchestrate/orchestrateAnalyze";
import { orchestrateRealize } from "../orchestrate/orchestrateRealize";
import { orchestrateTest } from "../orchestrate/orchestrateTest";
import { orchestratePrisma } from "../orchestrate/prisma/orchestratePrisma";

export const createAutoBeController = <Model extends ILlmSchema.Model>(props: {
  model: Model;
  context: AutoBeContext<Model>;
}): IAgenticaController.IClass<Model> => {
  assertSchemaModel(props.model);
  const application: ILlmApplication<Model> = collection[
    props.model
  ] as unknown as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: "autobe",
    application,
    execute: {
      analyze: orchestrateAnalyze(props.context),
      prisma: orchestratePrisma(props.context),
      interface: orchestrateInterface(props.context),
      test: orchestrateTest(props.context),
      realize: orchestrateRealize(props.context),
    },
  };
};

const claude = typia.llm.application<
  IAutoBeApplication,
  "claude",
  { reference: true }
>();
const collection = {
  chatgpt: typia.llm.application<
    IAutoBeApplication,
    "chatgpt",
    { reference: true }
  >(),
  claude,
  llama: claude,
  deepseek: claude,
  "3.1": claude,
  "3.0": typia.llm.application<IAutoBeApplication, "3.0">(),
};
