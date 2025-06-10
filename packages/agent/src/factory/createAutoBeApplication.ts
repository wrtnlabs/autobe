import { IAgenticaController } from "@agentica/core";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import typia from "typia";

import { AutoBeContext } from "../context/AutoBeContext";
import { IAutoBeApplication } from "../context/IAutoBeApplication";
import { assertSchemaModel } from "../context/assertSchemaModel";
import { orchestrateAnalyze } from "../orchestrate/analyze/orchestrateAnalyze";
import { orchestrateInterface } from "../orchestrate/interface/orchestrateInterface";
import { orchestrateRealize } from "../orchestrate/orchestrateRealize";
import { orchestrateTest } from "../orchestrate/orchestrateTest";
import { orchestratePrisma } from "../orchestrate/prisma/orchestratePrisma";
import { StringUtil } from "../utils/StringUtil";

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
            description:
              "Analysis completed successfully, and report has been published.",
          };
        else
          return {
            type: "in-progress",
            description: StringUtil.trim`
              Requirements are not yet fully elicited, 
              therefore additional questions will be made to the user.
            `,
          };
      },
      prisma: async (next) => {
        const r = await orchestratePrisma(props.context)(next);
        if (r.type === "prisma")
          return {
            type: r.compiled.type,
            description:
              r.compiled.type === "success"
                ? "Prisma schemas have been generated successfully."
                : r.result.success === false || r.compiled.type === "failure"
                  ? "Prisma schemas are generated, but compilation failed."
                  : "Unexpected error occurred while generating Prisma schemas.",
          };
        else
          return {
            type: "prerequisites-not-satisfied",
            description: "Requirement analysis is not yet completed.",
          };
      },
      interface: async (next) => {
        const r = await orchestrateInterface(props.context)(next);
        if (r.type === "interface")
          return {
            type: "success",
            description: "API interfaces have been designed successfully.",
          };
        else
          return {
            type: "prerequisites-not-satisfied",
            description: "Prisma schemas are not yet completed.",
          };
      },
      test: async (next) => {
        const r = await orchestrateTest(props.context)(next);
        if (r.type === "test")
          return {
            type: r.compiled.type,
            description:
              r.compiled.type === "success"
                ? "Test functions have been generated successfully."
                : r.compiled.type === "failure"
                  ? "Test functions are written, but compilation failed."
                  : "Unexpected error occurred while writing test functions.",
          };
        else
          return {
            type: "prerequisites-not-satisfied",
            description: "API interfaces are not yet completed.",
          };
      },
      realize: async (next) => {
        const r = await orchestrateRealize(props.context)(next);
        if (r.type === "realize")
          return {
            type: r.compiled.type,
            description:
              r.compiled.type === "success"
                ? "API implementation codes have been generated successfully."
                : r.compiled.type === "failure"
                  ? "Implementation codes are composed, but compilation failed."
                  : "Unexpected error occurred while writing implementation codes.",
          };
        else
          return {
            type: "prerequisites-not-satisfied",
            description: "API interfaces are not yet completed.",
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
