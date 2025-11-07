import { IAgenticaController } from "@agentica/core";
import {
  AutoBeAnalyzeHistory,
  AutoBeAssistantMessageEvent,
  AutoBeAssistantMessageHistory,
  AutoBeInterfaceHistory,
  AutoBePrismaHistory,
  AutoBeRealizeHistory,
  AutoBeTestHistory,
} from "@autobe/interface";
import { StringUtil } from "@autobe/utils";
import { ILlmApplication, ILlmSchema } from "@samchon/openapi";
import typia from "typia";

import { AutoBeContext } from "../../context/AutoBeContext";
import { assertSchemaModel } from "../../context/assertSchemaModel";
import { orchestrateAnalyze } from "../analyze/orchestrateAnalyze";
import { orchestrateInterface } from "../interface/orchestrateInterface";
import { orchestratePrisma } from "../prisma/orchestratePrisma";
import { orchestrateRealize } from "../realize/orchestrateRealize";
import { orchestrateTest } from "../test/orchestrateTest";
import { IAutoBeFacadeApplication } from "./histories/IAutoBeFacadeApplication";

export const createAutoBeFacadeController = <
  Model extends ILlmSchema.Model,
>(props: {
  model: Model;
  context: AutoBeContext<Model>;
}): IAgenticaController.IClass<Model> => {
  assertSchemaModel(props.model);
  const application: ILlmApplication<Model> = collection[
    props.model === "chatgpt"
      ? "chatgpt"
      : props.model === "gemini"
        ? "gemini"
        : "claude"
  ] satisfies ILlmApplication<any> as unknown as ILlmApplication<Model>;
  return {
    protocol: "class",
    name: "autobe",
    application,
    execute: {
      analyze: async () => {
        const history: AutoBeAssistantMessageHistory | AutoBeAnalyzeHistory =
          await orchestrateAnalyze(props.context);
        if (history.type === "assistantMessage")
          return {
            type: "in-progress",
            description: StringUtil.trim`
              Requirements are not yet fully elicited, 
              therefore additional questions will be made to the user.
            `,
          };
        return {
          type: "success",
          description:
            "Analysis completed successfully, and report has been published.",
        };
      },
      prisma: async (next) => {
        const history: AutoBeAssistantMessageHistory | AutoBePrismaHistory =
          await orchestratePrisma(props.context, next);
        if (history.type === "assistantMessage")
          return {
            type: "prerequisites-not-satisfied",
            description: "Requirement analysis is not yet completed.",
          };
        return {
          type: history.compiled.type,
          description:
            history.compiled.type === "success"
              ? "Prisma schemas have been generated successfully."
              : history.result.success === false ||
                  history.compiled.type === "failure"
                ? "Prisma schemas are generated, but compilation failed."
                : "Unexpected error occurred while generating Prisma schemas.",
        };
      },
      interface: async (next) => {
        const history: AutoBeAssistantMessageEvent | AutoBeInterfaceHistory =
          await orchestrateInterface(props.context)(next);
        if (history.type === "assistantMessage")
          return {
            type: "prerequisites-not-satisfied",
            description: "Prisma schemas are not yet completed.",
          };
        return {
          type: "success",
          description: "API interfaces have been designed successfully.",
        };
      },
      test: async (next) => {
        const history: AutoBeAssistantMessageHistory | AutoBeTestHistory =
          await orchestrateTest(props.context)(next);
        if (history.type === "assistantMessage")
          return {
            type: "prerequisites-not-satisfied",
            description: "API interfaces are not yet completed.",
          };
        return {
          type: history.compiled.type,
          description:
            history.compiled.type === "success"
              ? "Test functions have been generated successfully."
              : history.compiled.type === "failure"
                ? "Test functions are written, but compilation failed."
                : "Unexpected error occurred while writing test functions.",
        };
      },
      realize: async (next) => {
        const history: AutoBeAssistantMessageHistory | AutoBeRealizeHistory =
          await orchestrateRealize(props.context)(next);
        if (history.type === "assistantMessage")
          return {
            type: "prerequisites-not-satisfied",
            description: "API interfaces are not yet completed.",
          };
        return {
          type: history.compiled.type,
          description:
            history.compiled.type === "success"
              ? "API implementation codes have been generated successfully."
              : history.compiled.type === "failure"
                ? "Implementation codes are composed, but compilation failed."
                : "Unexpected error occurred while writing implementation codes.",
        };
      },
    } satisfies IAutoBeFacadeApplication,
  };
};

const collection = {
  chatgpt: typia.llm.application<IAutoBeFacadeApplication, "chatgpt">(),
  claude: typia.llm.application<IAutoBeFacadeApplication, "claude">(),
  gemini: typia.llm.application<IAutoBeFacadeApplication, "gemini">(),
};
