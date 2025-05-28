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
      analyze: async (next) => {
        const r = await orchestrateAnalyze(props.context)(next);
        if (r.type === "analyze")
          return {
            type: "success",
          };
        else
          return {
            type: "in-progress",
          };
      },
      prisma: async (next) => {
        const r = await orchestratePrisma(props.context)(next);
        if (r.type === "prisma")
          return {
            type: r.result.type,
          };
        else
          return {
            type: "in-progress",
          };
      },
      interface: async (next) => {
        const r = await orchestrateInterface(props.context)(next);
        if (r.type === "interface")
          return {
            type: "success",
          };
        else
          return {
            type: "in-progress",
          };
      },
      test: async (next) => {
        const r = await orchestrateTest(props.context)(next);
        if (r.type === "test")
          return {
            type: r.result.type,
          };
        else
          return {
            type: "in-progress",
          };
      },
      realize: async (next) => {
        const r = await orchestrateRealize(props.context)(next);
        if (r.type === "realize")
          return {
            type: r.result.type,
          };
        else
          return {
            type: "in-progress",
          };
      },
    } satisfies IAutoBeApplication,
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
